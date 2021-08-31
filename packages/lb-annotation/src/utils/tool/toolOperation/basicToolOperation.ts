import { isNumber } from 'lodash';
import { EDragStatus, EGrowthMode, ELang } from '../../../constant/annotation';
import EKeyCode from '../../../constant/keyCode';
import { BASE_ICON, COLORS_ARRAY } from '../../../constant/style';
import ActionsHistory from '../../ActionsHistory';
import { getAttributeIndex } from '../attribute';
import { calcViewportBoundaries, getRotate, jsonParser } from '../common';
import DblClickEventListener from '../DblClickEventListener';
import DrawUtils from '../DrawUtils';
import { getBasicRecPos, getInitImgPos } from '../imgPos';
import RenderDomUtil from '../RenderDomUtil';
import ZoomUtil from '../ZoomUtil';
import EventListener from './eventListener';
import locale from '../../../locales';
import { EMessage } from '../../../locales/constants';

interface IBasicToolOperationProps {
  container: HTMLDivElement;
  size: ISize;
  imgNode?: HTMLImageElement; // 展示图片的内容
  style?: any; // 后期一定要补上!!

  rotate?: number;
  imgAttribute?: any; // 占个坑，用于全局的一些配置，是否展示原图比例
  forbidOperation?: boolean;

  config: string; // 任务配置

  defaultAttribute?: string;
  forbidCursorLine?: boolean;
  showDefaultCursor?: boolean; // 默认会展示为 none
}

// zoom 的限制
const zoomInfo = {
  min: 0.2,
  max: 1000,
  ratio: 0.4,
};

class BasicToolOperation extends EventListener {
  public container: HTMLDivElement; // 当前结构绑定 container

  public canvas!: HTMLCanvasElement;

  public imgNode?: HTMLImageElement;

  public basicImgInfo: any; // 用于存储当前图片的信息

  public isImgError: boolean; // 图片是否错误

  // 数据依赖
  public basicResult?: any;

  // 工具记录
  public history: ActionsHistory; // 存储当前任务下的所有记录

  public size: ISize;

  public isShowCursor: boolean; // 是否展示十字光标

  public forbidOperation: boolean; // 禁止操作

  // public style: {
  //   strokeColor: string;
  //   fillColor: string;
  //   strokeWidth: number;
  //   opacity: number;
  // };
  public style: any;

  // 用于拖拽缩放操作
  public currentPos: ICoordinate; // 存储实时偏移的位置

  public coord: ICoordinate; // 存储当前鼠标的坐标

  public imgInfo?: ISize;

  public zoom: number;

  public isDrag = false; // 判断是否进行拖拽

  public isSpaceKey = false; // 是否点击空格键

  public attributeLockList: string[]; // 属性限制列表

  public dblClickListener: DblClickEventListener;

  public isHidden: boolean;

  public config: any; // 供后面操作使用

  public dragStatus: EDragStatus; // 用于拖拽中间状态的判断

  public defaultAttribute: string; // 默认属性

  public forbidCursorLine: boolean;

  public lang: ELang;

  // 拖拽 - 私有变量
  private _firstClickCoordinate?: ICoordinate; // 存储第一次点击的坐标

  private innerZoom = 1; // 用于内外 zoom 事件的变量

  private currentPosStorage?: ICoordinate; // 存储当前点击的平移位置

  private basicZoom = 0.01; // 限定最少放大倍数

  private isSpaceClick = false; // 用于空格拖拽

  private isDragStart = false; // 用于拖拽情况的初始判定

  private startTime = 0; // 开始时间

  private _ctx?: CanvasRenderingContext2D;

  private _imgAttribute?: IImageAttribute;

  private _invalidDOM?: HTMLDivElement;

  private showDefaultCursor: boolean; // 是否展示默认的 cursor

  constructor(props: IBasicToolOperationProps) {
    super();
    this.container = props.container;
    this.showDefaultCursor = props.showDefaultCursor || false;

    this.destroyCanvas();
    this.createCanvas(props.size);
    this.imgNode = props.imgNode;
    this.isImgError = !props.imgNode;
    this.basicImgInfo = {
      width: props.imgNode?.width ?? 0,
      height: props.imgNode?.height ?? 0,
      valid: true,
      rotate: 0,
    };
    this.forbidOperation = props.forbidOperation ?? false;
    this.size = props.size;
    this.currentPos = {
      x: 0,
      y: 0,
    };
    this.zoom = 1;
    this.coord = {
      x: -1,
      y: -1,
    };
    this.currentPosStorage = {
      x: 0,
      y: 0,
    };
    this.isShowCursor = false;
    this.style = {
      strokeColor: COLORS_ARRAY[4],
      fillColor: COLORS_ARRAY[4],
      strokeWidth: 2,
      opacity: 1,
    };
    this.attributeLockList = [];
    this.history = new ActionsHistory();
    this.setStyle(props.style);
    this._imgAttribute = props.imgAttribute;
    this.isHidden = false;
    this.dragStatus = EDragStatus.Wait;
    this.defaultAttribute = props?.defaultAttribute ?? '';
    this.forbidCursorLine = !!props.forbidCursorLine;
    this.lang = ELang.Zh;

    // 阻止右键菜单栏
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onLeftDblClick = this.onLeftDblClick.bind(this);
    this.onRightDblClick = this.onRightDblClick.bind(this);
    this.onClick = this.onClick.bind(this);
    this.clearImgDrag = this.clearImgDrag.bind(this);

    // 初始化监听事件
    this.dblClickListener = new DblClickEventListener(this.container, 200);
  }

  public onContextmenu(e: MouseEvent) {
    e.preventDefault();
  }

  get ctx() {
    return this._ctx || this.canvas?.getContext('2d');
  }

  get rotate() {
    return this.basicImgInfo?.rotate ?? 0;
  }

  get valid() {
    return this.basicImgInfo?.valid ?? true;
  }

  get baseIcon() {
    // this.style.color 获取当前的颜色的位置的  1 3 5 7 9
    return BASE_ICON[this.style.color];
  }

  get defaultCursor() {
    return this.showDefaultCursor ? 'default' : 'none';
  }

  /** 数据列表，根据其判断是否可以旋转 */
  get dataList(): any[] {
    return [];
  }

  public setLang(lang: ELang) {
    this.lang = lang;
  }

  public setShowDefaultCursor(showDefaultCursor: boolean) {
    this.showDefaultCursor = showDefaultCursor;
    this.container.style.cursor = this.defaultCursor;
  }

  // 是否限制鼠标操作
  public get forbidMouseOperation() {
    return this.forbidOperation || this.valid === false;
  }

  public init() {
    this.eventUnbinding();
    this.initPosition();
    this.eventBinding();
    this.render();
  }

  public destroy() {
    this.destroyCanvas();
    this.eventUnbinding();
  }

  public createCanvas(size: ISize) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', `${size.width}`);
    canvas.setAttribute('height', `${size.height}`);
    this.container.appendChild(canvas);
    this.canvas = canvas;
    this.container.style.cursor = this.defaultCursor;
  }

  public destroyCanvas() {
    if (this.canvas && this.container.contains(this.canvas)) {
      // container 内可能包含其他元素，故需单独清楚
      this.container.removeChild(this.canvas);
    }
  }

  /**
   * 设置框的样式
   * @param lineWidth
   * @param strokeColor
   */
  public setStyle(toolStyle: any) {
    this.style = toolStyle;
    this.render();
  }

  public setImgNode(imgNode: HTMLImageElement, basicImgInfo: Partial<{ valid: boolean; rotate: number }> = {}) {
    this.imgNode = imgNode;
    this.basicImgInfo = {
      width: imgNode.width,
      height: imgNode.height,
      valid: true,
      rotate: 0,
      ...basicImgInfo,
    };

    if (this.isImgError === true) {
      this.isImgError = false;
      this.emit('changeAnnotationShow');
    }

    if (typeof basicImgInfo.valid === 'boolean') {
      this.setValid(basicImgInfo.valid);
    }

    this.initImgPos();
    this.render();
  }

  public setErrorImg() {
    const originIsImgError = this.isImgError;
    // 设置当前为错误图片
    this.isImgError = true;
    this.imgNode = undefined;
    this.basicImgInfo = {
      width: 0,
      height: 0,
      valid: true,
      rotate: 0,
    };

    if (originIsImgError === false) {
      this.emit('changeAnnotationShow');
    }
  }

  public setBasicImgInfo(basicImgInfo: any) {
    this.basicImgInfo = basicImgInfo;
  }

  public setForbidOperation(forbidOperation: boolean) {
    this.forbidOperation = forbidOperation;
    this.render();
  }

  public setIsHidden(isHidden: boolean) {
    this.isHidden = isHidden;

    this.emit('hiddenChange');
  }

  /**
   * 用于外界直接控制序号的是否展示
   * @param isShowOrder
   */
  public setIsShowOrder(isShowOrder: boolean) {
    this.config.isShowOrder = isShowOrder;
    this.render();
  }

  /** 获取坐标值 */
  public getCoordinate(e: MouseEvent) {
    const bounding = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - bounding.left,
      y: e.clientY - bounding.top,
    };
  }

  /** 获取当前zoom 下的坐标 */
  public getCoordinateUnderZoom(e: MouseEvent) {
    const bounding = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - bounding.left - this.currentPos.x,
      y: e.clientY - bounding.top - this.currentPos.y,
    };
  }

  public getGetCenterCoordinate() {
    return {
      x: this.size.width / 2,
      y: this.size.height / 2,
    };
  }

  /** 用于初始化图片的位置 */
  public initImgPos = async () => {
    if (!this.imgNode) {
      return;
    }
    const zoomRatio = this._imgAttribute?.zoomRatio;
    const isOriginalSize = this._imgAttribute?.isOriginalSize;
    const { currentPos, imgInfo, zoom } = getInitImgPos(
      this.size,
      { width: this.imgNode.width, height: this.imgNode.height },
      this.rotate,
      zoomRatio,
      isOriginalSize,
    );

    this.currentPos = currentPos;
    this.currentPosStorage = currentPos;
    this.imgInfo = imgInfo;
    this.zoom = zoom;
    this.innerZoom = zoom;
    this.render();

    this.emit('dependRender');
    this.emit('renderZoom');
  };

  /**
   * 用于依赖情况下的图片初始化
   */
  public initPosition() {
    if (this.basicResult && this.imgInfo && this._imgAttribute) {
      // 目的： 初始化有依赖情况下的多框展示
      const { basicResult, size, imgNode, _imgAttribute, imgInfo } = this;
      if (basicResult && imgNode) {
        let newBoundry = basicResult;

        // 依赖检测
        if (basicResult.pointList) {
          // 多边形检测
          const basicZone = calcViewportBoundaries(basicResult.pointList);
          newBoundry = {
            x: basicZone.left,
            y: basicZone.top,
            width: basicZone.right - basicZone.left,
            height: basicZone.bottom - basicZone.top,
          };
        }

        const pos = getBasicRecPos(
          imgNode,
          newBoundry,
          size,
          undefined,
          _imgAttribute?.zoomRatio,
          _imgAttribute?.isOriginalSize,
        );
        if (pos) {
          this.currentPos = pos.currentPos;
          this.currentPosStorage = this.currentPos;
          this.imgInfo = {
            ...imgInfo,
            width: (imgInfo.width / this.innerZoom) * pos.innerZoom,
            height: (imgInfo.height / this.innerZoom) * pos.innerZoom,
          };
          this.innerZoom = pos.innerZoom;

          // 需要加载下更改当前的 imgInfo
          this.zoom = pos.innerZoom;
          this.render();
        }
      }
    } else {
      this.initImgPos();
    }
  }

  public getCurrentPos = (coord: any) => {
    const { _firstClickCoordinate, currentPosStorage } = this;
    try {
      let currentPos;
      if (_firstClickCoordinate && currentPosStorage) {
        currentPos = {
          y: currentPosStorage.y + coord.y - _firstClickCoordinate.y,
          x: currentPosStorage.x + coord.x - _firstClickCoordinate.x,
        };
      } else {
        currentPos = {
          x: 0,
          y: 0,
        };
      }
      return currentPos;
    } catch (e) {
      console.error(e);
      return {
        x: 0,
        y: 0,
      };
    }
  };

  /** 撤销 */
  public undo() {
    this.history.undo();
  }

  /** 重做 */
  public redo() {
    this.history.redo();
  }

  public clearCanvas() {
    this.ctx?.clearRect(0, 0, this.size.width, this.size.height);
  }

  /** 事件绑定 */
  public eventBinding() {
    this.dblClickListener.addEvent(this.onMouseUp, this.onLeftDblClick, this.onRightDblClick);
    this.container.addEventListener('mousedown', this.onMouseDown);
    this.container.addEventListener('mousemove', this.onMouseMove);
    // this.container.addEventListener('mouseup', this.onMouseUp);
    this.container.addEventListener('mouseleave', this.onMouseLeave);
    this.container.addEventListener('click', this.onClick);
    this.container.addEventListener('wheel', this.onWheel);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    window.parent.document.addEventListener('contextmenu', this.onContextmenu, false);
  }

  public eventUnbinding() {
    this.container.removeEventListener('mousedown', this.onMouseDown);
    this.container.removeEventListener('mousemove', this.onMouseMove);
    this.container.removeEventListener('mouseup', this.onMouseUp);
    this.container.removeEventListener('mouseleave', this.onMouseLeave);
    this.container.removeEventListener('wheel', this.onWheel);
    this.container.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    window.parent.document.removeEventListener('contextmenu', this.onContextmenu, false);

    this.dblClickListener.removeEvent();
  }

  public clearImgDrag() {
    this.isDrag = false;
    this.isDragStart = false;
    this.isSpaceClick = false;
    this.startTime = 0;
    this.container.style.cursor = this.defaultCursor;
    this.forbidCursorLine = false;
  }

  public onMouseDown(e: MouseEvent): void | boolean {
    // e.stopPropagation();
    if (!this.canvas || this.isImgError) {
      return true;
    }

    // if (window.getSelection) {
    //   // 获取选中
    //   const selection = window.getSelection();
    //   // 清除选中
    //   selection.removeAllRanges();
    // } else if (document.selection && document.selection.empty) {
    //   // 兼容 IE8 以下，但 IE9+ 以上同样可用
    //   document.selection.empty();
    // }

    const coord = this.getCoordinate(e);

    if ((this.isSpaceKey && e.button === 0) || e.button === 2) {
      e.stopPropagation();
      this._firstClickCoordinate = coord;
      this.currentPosStorage = this.currentPos;
      this.isSpaceClick = true;
      this.isDragStart = true;
      this.startTime = new Date().getTime();
    }
  }

  public onMouseMove(e: MouseEvent): boolean | void {
    if (!this.canvas || this.isImgError) {
      return true;
    }

    const coord = this.getCoordinate(e);

    // 是否展示十字光标
    if (this.isShowCursor) {
      this.coord = coord;
      this.render();
    }

    try {
      if (!coord || !isNumber(coord?.x) || !isNumber(coord?.y)) {
        throw new Error('coord error');
      }

      this.coord = coord;
      if ((this.isSpaceClick || this.isDragStart) && this._firstClickCoordinate) {
        const currentPos = this.getCurrentPos(coord);
        this.currentPos = currentPos;
        this.isDrag = true;
        this.container.style.cursor = 'grabbing';
        this.forbidCursorLine = true;
        this.emit('dependRender');
      }

      this.render();
    } catch (error) {
      console.error(error);
    }
  }

  public onMouseUp(e: MouseEvent): boolean | void {
    if (!this.canvas || this.isImgError) {
      return true;
    }
    this.container.style.cursor = this.defaultCursor;
    this.forbidCursorLine = false;

    this.isDrag = false;
    this.isDragStart = false;
    this.isSpaceClick = false;

    if (this.startTime !== 0) {
      const time = new Date().getTime();

      if (time - this.startTime > 300 || this.isSpaceKey === true) {
        e.stopPropagation();
        this.startTime = 0;
        this.render();
        return true;
      }
    }

    this.startTime = 0;
    this.render();
  }

  // 后续需抽象成 abstract
  // eslint-disable-next-line no-unused-vars
  public onMouseLeave(e: MouseEvent) {
    //  鼠标脱离了屏幕
  }

  // eslint-disable-next-line no-unused-vars
  public onClick(e: MouseEvent) {}

  // eslint-disable-next-line no-unused-vars
  public onLeftDblClick(e: MouseEvent) {
    // 左键双击
  }

  // eslint-disable-next-line no-unused-vars
  public onRightDblClick(e: MouseEvent) {
    // 右键双击
    this.clearImgDrag();
  }

  public onKeyDown(e: KeyboardEvent): boolean | void {
    /** 取消window系统下默认的失焦事件 */
    if (e.keyCode === EKeyCode.Alt) {
      e.preventDefault();
    }

    // empty
    switch (e.keyCode) {
      case EKeyCode.Space:
        this.isSpaceKey = true;
        break;

      case EKeyCode.Z:
        if (e.ctrlKey) {
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }

          return false;
        }
        break;

      default: {
        break;
      }
      // case EKeyCode.F11:
      //   if (!document.fullscreenElement) {
      //     document.documentElement.requestFullscreen();
      //   } else {
      //     if (document.exitFullscreen) {
      //       document.exitFullscreen();
      //     }
      //   }
      //   e.preventDefault();

      //   break;
    }
    return true;
  }

  public onKeyUp(e: KeyboardEvent): boolean | void {
    // empty
    switch (e.keyCode) {
      case EKeyCode.Space:
        this.isSpaceKey = false;
        break;

      default: {
        break;
      }
    }
  }

  // 按鼠标位置放大缩小
  public onWheel(e: any, isRender = true): boolean | void {
    if (!this.imgNode || !this.coord) {
      return;
    }
    const coord = this.getCoordinate(e);

    const delta = e.deltaY || e.wheelDelta;

    let operator: 0 | -1 | 1 = 0;

    if (delta > 0 && this.zoom > zoomInfo.min) {
      // 减小
      operator = -1;
    }
    if (delta < 0 && this.zoom < zoomInfo.max) {
      // 放大
      operator = 1;
    }

    this.wheelChangePos(coord, operator);
    this.emit('dependRender');
    if (isRender) {
      this.render();
    }
  }

  public wheelChangePos = (coord: ICoordinate, operator: 1 | -1 | 0, newZoom?: number) => {
    // 更改放大后图片的位置以及倍数, operator: 1 放大， -1 缩小， 0 放大
    const { currentPos, imgNode } = this;
    if (!imgNode) {
      console.error('unable to load image');
      return;
    }
    if (this.zoom === this.basicZoom && operator === -1) {
      return;
    }

    const pos = ZoomUtil.wheelChangePos(imgNode, coord, operator, currentPos, {
      zoom: newZoom || this.zoom,
      innerZoom: this.innerZoom,
      basicZoom: this.basicZoom,
      zoomMax: zoomInfo.max,
      rotate: this.rotate,
    });

    if (!pos) {
      return;
    }

    const { currentPos: newCurrentPos, ratio, zoom, imgInfo } = pos;
    this.innerZoom = zoom;
    this.zoom = zoom;
    this.currentPos = newCurrentPos;
    this.currentPosStorage = newCurrentPos;
    this.imgInfo = imgInfo;
    zoomInfo.ratio = ratio;
    this.emit('renderZoom');
  };

  /**
   * 通过ZOOM_LEVEL, 计算出下一个缩放的值。
   * @param isZoomIn 是否为放大
   */
  public zoomChanged = (isZoomIn: boolean, growthMode = EGrowthMode.Linear) => {
    const newZoom = ZoomUtil.zoomChanged(this.zoom, isZoomIn, growthMode);
    this.wheelChangePos(this.getGetCenterCoordinate(), newZoom > this.zoom ? 1 : -1, newZoom);
    this.render();
  };

  public renderCursorLine(lineColor = this.style.lineColor[0] ?? '') {
    if (!this.ctx || this.forbidCursorLine) {
      return;
    }

    const { x, y } = this.coord;
    DrawUtils.drawLine(this.canvas, { x: 0, y }, { x: 10000, y }, { color: lineColor });
    DrawUtils.drawLine(this.canvas, { x, y: 0 }, { x, y: 10000 }, { color: lineColor });
    DrawUtils.drawCircleWithFill(this.canvas, { x, y }, 1, { color: 'white' });
  }

  public drawImg = () => {
    if (!this.imgNode) return;

    DrawUtils.drawImg(this.canvas, this.imgNode, {
      zoom: this.zoom,
      currentPos: this.currentPos,
      rotate: this.rotate,
      imgAttribute: this._imgAttribute,
    });
  };

  /**
   * 更改当前 canvas 整体的大小，需要重新初始化
   * @param size
   */
  public setSize(size: ISize) {
    this.size = size;
    if (this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
      this.createCanvas(size);
      this.eventUnbinding();
      this.init();
    }
  }

  public setImgAttribute(imgAttribute: IImageAttribute) {
    const oldImgAttribute = this._imgAttribute;
    this._imgAttribute = imgAttribute;
    if (
      oldImgAttribute?.zoomRatio !== imgAttribute.zoomRatio ||
      oldImgAttribute.isOriginalSize !== imgAttribute.isOriginalSize
    ) {
      this.initImgPos();
    }
    this.render();
  }

  public clearResult(sendMessage?: boolean | string) {
    // 清除数据
    if (sendMessage) {
      // send someting
    }
  }

  public setValid(valid: boolean) {
    this.basicImgInfo.valid = valid;
    if (valid === false) {
      this.renderInvalidPage();
      this.clearResult(false);
    } else {
      this.clearInvalidPage();
    }
  }

  public setRotate(rotate: number) {
    this.basicImgInfo.rotate = rotate;
  }

  public setBasicResult(basicResult: any) {
    this.basicResult = basicResult;
    this.initPosition();
    this.emit('dependRender');
  }

  public setAttributeLockList(attributeLockList: string[]) {
    this.attributeLockList = attributeLockList;
    this.render();
  }

  public setConfig(config: string) {
    this.config = jsonParser(config);
  }

  public updateRotate() {
    if (this.dataList.length > 0) {
      this.emit('messageInfo', locale.getMessagesByLocale(EMessage.NoRotateNotice, this.lang));
      return false;
    }

    // 更改当前图片的旋转方式
    const rotate = getRotate(this.basicImgInfo.rotate);
    this.basicImgInfo.rotate = rotate;
    this.initImgPos();

    // 触发外层 result 的更改
    this.emit('updateResult');
  }

  /** 获取当前属性颜色 */
  public getColor(attribute = '', config = this.config) {
    if (config?.attributeConfigurable === true) {
      const attributeIndex = getAttributeIndex(attribute, config.attributeList ?? []) + 1;
      return this.style.attributeColor[attributeIndex];
    }
    const { color, toolColor } = this.style;
    return toolColor[color];
  }

  public getLineColor(attribute = '') {
    if (this.config?.attributeConfigurable === true) {
      const attributeIndex = getAttributeIndex(attribute, this.config?.attributeList ?? []) + 1;
      return this.style?.attributeLineColor[attributeIndex] ?? '';
    }
    const { color, lineColor } = this.style;
    if (color && lineColor) {
      return lineColor[color];
    }
    return '';
  }

  public clearInvalidPage() {
    if (this._invalidDOM && this.container && this.container.contains(this._invalidDOM)) {
      this.container.removeChild(this._invalidDOM);
      this._invalidDOM = undefined;
    }
  }

  public renderInvalidPage() {
    if (!this.container || this._invalidDOM) {
      return;
    }

    this._invalidDOM = RenderDomUtil.renderInvalidPage(this.canvas, this.container, this.lang);
  }

  public render() {
    if (!this.canvas || !this.ctx || !this.imgNode) {
      return;
    }

    this.clearCanvas();
    this.drawImg();
  }

  // 触发外界 style 的样式
  public changeStyle(newAttribute = this.defaultAttribute) {
    this.emit('changeStyle', { attribute: newAttribute });
  }
}

export { IBasicToolOperationProps, BasicToolOperation };