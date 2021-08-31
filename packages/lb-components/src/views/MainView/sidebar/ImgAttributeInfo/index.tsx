import { QuestionOutlined } from '@ant-design/icons';
import {
  Col, Row, Slider, Switch, Input,
} from 'antd';
import { connect } from 'react-redux';
import { throttle } from 'lodash';
import React from 'react';
import { ImgAttributeState } from '@/store/imgAttribute/types';
import ImgAttribute from '@/store/imgAttribute/actionCreators';
import { store } from '@/index';

import saturationSvg from '@/assets/annotation/image/saturation.svg';
import contrastSvg from '@/assets/annotation/image/contrast.svg';
import brightnessSvg from '@/assets/annotation/image/brightness.svg';
import ZoomUpSvg from '@/assets/attributeIcon/zoomUp.svg';

interface IProps {
  imgAttribute: ImgAttributeState;
}

const ImgAttributeInfo = (props: IProps) => {
  const {
    imgAttribute: {
      contrast,
      saturation,
      brightness,
      zoomRatio,
      isOriginalSize,
    },
  } = props;

  const imgAttributeChange = throttle(
    (payload: ImgAttributeState) => {
      store.dispatch(ImgAttribute.UpdateImgAttribute(payload));
    },
    60,
    { trailing: true },
  );

  const imgAttributeInfo = [
    {
      name: '饱和度',
      min: -100,
      max: 500,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ saturation: v }),
      value: saturation,
      svg: saturationSvg,
    },
    {
      name: '对比度',
      min: -100,
      max: 300,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ contrast: v }),
      value: contrast,
      svg: contrastSvg,
    },
    {
      name: '曝光度',
      min: -100,
      max: 400,
      step: 2,
      onChange: (v: number) => imgAttributeChange({ brightness: v }),
      value: brightness,
      svg: brightnessSvg,
    },
    {
      name: '画面占比',
      min: 0.1,
      max: 10,
      step: 0.1,
      onChange: (v: number) => imgAttributeChange({ zoomRatio: v }),
      value: zoomRatio,
      svg: ZoomUpSvg,
    },
  ];

  return (
    <div>
      {imgAttributeInfo.map((info: any, index: number) => (
        <div className="imgAttributeController" key={`option_${index}`}>
          <Row
            className="tools"
            style={{ padding: '0px 0' }}
          >
            <Col span={24}>
              <span className="singleTool">
                <img width={12} height={12} src={info.svg} />
                <span className="toolName">{info.name}</span>
              </span>
            </Col>
          </Row>
          <Row>
            <Col span={20}>
              <Slider
                min={info.min}
                max={info.max}
                step={info.step}
                value={info.value}
                onChange={info.onChange}
              />
            </Col>
            <Col span={4}>
              <Input
                value={info.value}
                disabled
                style={{
                  fontSize: 12,
                  marginBottom: 23,
                  padding: '0px 2px',
                  textAlign: 'center',
                }}
              />
            </Col>
          </Row>
        </div>
      ))}
      <div className="imgAttributeController">
        <Row
          className="tools"
          style={{ padding: '10px 0' }}
        >
          <Col span={18}>
            <span className="singleTool">
              <QuestionOutlined rotate={180} />
              <span className="toolName">按原图比例显示</span>
            </span>
          </Col>
          <Col>
            <Switch
              checked={isOriginalSize}
              onChange={(v: boolean) => imgAttributeChange({ isOriginalSize: v })}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

function mapStateToProps({ imgAttribute }: any) {
  return { imgAttribute };
}

export default connect(mapStateToProps)(ImgAttributeInfo);