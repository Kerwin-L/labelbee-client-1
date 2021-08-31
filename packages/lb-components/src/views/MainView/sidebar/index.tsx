import React from 'react';
import { Row, Collapse } from 'antd';
import iconRectPatternSvg from '@/assets/annotation/rectTool/icon_rectPattern.svg';
import iconRectPatternASvg from '@/assets/annotation/rectTool/icon_rectPatternA.svg';
import iconPolygonPatternASvg from '@/assets/annotation/polygonTool/icon_polygon_a.svg';
import { AppState } from '@/store';
import StepUtils from '@/utils/StepUtils';
import { connect } from 'react-redux';
import { EToolName } from '@/data/enums/ToolType';
import ImgAttributeInfo from './ImgAttributeInfo';
import SwitchAttributeList from './SwitchAttributeList';
import GeneralOperation from './GeneralOperation';
import AnnotationText from './AnnotationText';
import ToolStyle from './ToolStyle';
import ClearIcon from './ClearIcon';
import TagSidebar, { expandIconFuc } from './TagSidebar';
import { prefix } from '@/constant';
import TextToolSidebar from './TextToolSidebar';

const { Panel } = Collapse;

interface IProps {
  toolName?: EToolName;
}

const toolList = [
  {
    toolName: EToolName.Rect,
    commonSvg: iconRectPatternSvg,
    selectedSvg: iconRectPatternASvg,
  },
  // 多边形工具
  {
    toolName: EToolName.Polygon,
    commonSvg: iconPolygonPatternASvg,
    selectedSvg: iconPolygonPatternASvg,
  },
];
const sidebarCls = `${prefix}-sidebar`;
const Sidebar: React.FC<IProps> = ({ toolName }) => {
  if (!toolName) {
    return null;
  }

  if (
    [EToolName.Rect, EToolName.Point, EToolName.Line, EToolName.Rect, EToolName.Polygon].includes(
      toolName,
    )
  ) {
    const renderTool = toolList?.find((item) => item?.toolName === toolName);

    /**
     * 样式面板, 包含透明度、线框、颜色
     * @param key 虚拟dom的key
     */
    const renderStylePanel = (key: string) => {
      const ToolStyleComponent = <ToolStyle />;
      return (
        <Panel header='样式' className='panel' key={key}>
          {ToolStyleComponent}
        </Panel>
      );
    };

    return (
      <div className={`${sidebarCls}`}>
        <div className={`${sidebarCls}__level`}>
          <Row className={`${sidebarCls}__toolsOption`}>
            {renderTool && (
              <a>
                <img className={`${sidebarCls}__singleTool`} src={renderTool?.selectedSvg} />
              </a>
            )}
          </Row>
        </div>
        <div className={`${sidebarCls}__horizontal`} />
        <SwitchAttributeList />
        <AnnotationText />
        <div className={`${sidebarCls}__horizontal`} />
        <Collapse
          defaultActiveKey={['1', 'imgAttribute']}
          bordered={false}
          expandIconPosition='right'
          className={`${sidebarCls}__content`}
          expandIcon={expandIconFuc}
        >
          {renderStylePanel('1')}
          <Panel
            header={
              <div>
                图片调整
                <ClearIcon />
              </div>
            }
            className='panel'
            key='imgAttribute'
          >
            <ImgAttributeInfo />
          </Panel>
        </Collapse>

        <GeneralOperation />
      </div>
    );
  }

  if (toolName === EToolName.Tag) {
    return (
      <div className={`${sidebarCls}`}>
        <TagSidebar />
      </div>
    );
  }

  if (toolName === EToolName.Text) {
    return (
      <div className='sidebar'>
        <TextToolSidebar />
      </div>
    );
  }

  return null;
};

const mapStateToProps = (state: AppState) => {
  const stepInfo = StepUtils.getCurrentStepInfo(state.annotation.step, state.annotation.stepList);

  return {
    toolName: stepInfo?.tool,
  };
};

export default connect(mapStateToProps)(Sidebar);