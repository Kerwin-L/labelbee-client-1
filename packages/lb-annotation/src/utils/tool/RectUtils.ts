import AxisUtils from './AxisUtils';

export default class RectUtils {
  public static changeCoordinateByRotate(rect: IRect, rotate: number, imgSize: ISize) {
    const { x, y, width, height } = rect;

    // 矩形框左上角的位置
    const leftTopCoordinate = AxisUtils.changeCoordinateByRotate({ x, y }, rotate, imgSize);

    switch (rotate % 360) {
      case 90:
        return {
          ...rect,
          x: leftTopCoordinate.x - height,
          y: leftTopCoordinate.y,
          width: height,
          height: width,
        };

      case 180:
        return {
          ...rect,
          x: leftTopCoordinate.x - width,
          y: leftTopCoordinate.y - height,
        };

      case 270:
        return {
          ...rect,
          x: leftTopCoordinate.x,
          y: leftTopCoordinate.y - width,
          width: height,
          height: width,
        };

      default:
        return rect;
    }
  }

  /**
   * 矩形框顺时针生成点集
   * @param rect
   * @returns
   */
  public static translateRect2Points(rect: IRect): IPoint[] {
    const { x, y, width, height } = rect;

    return [
      {
        x,
        y,
      },
      {
        x: x + width,
        y,
      },
      {
        x: x + width,
        y: y + height,
      },
      {
        x,
        y: y + height,
      },
    ];
  }

  public static translatePoints2Rect(points: IPoint[], basicRect: IRect): IRect | undefined {
    if (points.length !== 4) {
      return;
    }

    const { x, y } = points[0];
    const width = points[1].x - points[0].x;
    const height = points[2].y - points[1].y;

    return {
      ...basicRect,
      x,
      y,
      width,
      height,
    };
  }
}