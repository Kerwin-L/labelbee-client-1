import React, { useState } from 'react';
import { Col, Popconfirm } from 'antd';
import clearResultSvg from '@/assets/annotation/common/icon_clear.svg';
import clearResultASvg from '@/assets/annotation/common/icon_clear_a.svg';
import copyBackStepSvg from '@/assets/annotation/common/icon_invalid.svg';
import copyBackStepASvg from '@/assets/annotation/common/icon_invalid_a.svg';
import { StopOutlined } from '@ant-design/icons';
import { store } from '@/index';

import { AppState } from '@/store';
import { connect } from 'react-redux';
import { ToolInstance } from '@/store/annotation/types';
import StepUtils from '@/utils/StepUtils';
import { IStepInfo } from '@/types/step';
import { jsonParser } from '@/utils';
import { AnnotationFileList } from '@/types/data';
import { CopyBackWordResult, UpdateImgList } from '@/store/annotation/actionCreators';

const makeSure = (info: string, key: string) => <div key={key}>{`确认${info.slice(0)}？`}</div>;

const renderImg = (info: Element | string) => {
  if (typeof info === 'string') {
    return <img width={23} height={25} src={info} />;
  }
  return info;
};

interface IProps {
  toolInstance: ToolInstance;
  stepInfo: IStepInfo;
  imgList: AnnotationFileList;
  imgIndex: number;
}

const GenerationOperation: React.FC<IProps> = ({
  toolInstance, stepInfo, imgList, imgIndex,
}) => {
  const [isHover, setHover] = useState<string | null>(null);
  const allOperation = [
    {
      name: '清空标注',
      key: 'sureClear',
      imgSvg: clearResultSvg,
      hoverSvg: clearResultASvg,
      onClick: () => {
        toolInstance?.clearResult();
      },
    },
  ];

  const config = jsonParser(stepInfo?.config);
  if (stepInfo?.dataSourceStep === 0) {
    const iconStyle = {
      height: '25px',
      lineHeight: '25px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    };
    allOperation.push({
      name: toolInstance.valid === true ? '标为无效' : '取消无效',
      key: 'sureQuestion',
      imgSvg: <StopOutlined style={iconStyle} />,
      hoverSvg: <StopOutlined style={{ color: '#666fff', ...iconStyle }} />,
      onClick: () => {
        toolInstance.setValid(!toolInstance.valid);
      },
    });
  }

  if (config?.copyBackwardResult) {
    allOperation.unshift({
      name: '复制上张',
      key: 'sureCopy',
      imgSvg: copyBackStepSvg,
      hoverSvg: copyBackStepASvg,
      onClick: () => {
       store.dispatch(CopyBackWordResult())
      },
    });
  }

  const annotationLength = Math.floor(24 / allOperation.length);

  return (
    <div className="generalOperation">
      {allOperation.map((info, index) => (
        <Col span={annotationLength} key={index}>
          <div
            key={info.key}
            className="item"
            onMouseEnter={() => {
              setHover(info.key);
            }}
            onMouseLeave={() => {
              setHover(null);
            }}
          >
            <Popconfirm
              title={info.key.startsWith('sure') ? makeSure(info.name, info.key) : info.name}
              disabled={!info.key.startsWith('sure')}
              placement="topRight"
              okText="确认"
              cancelText="取消"
              onConfirm={info.onClick}
            >
              <div className="icon">
                {renderImg(info.key === isHover ? info.hoverSvg : info.imgSvg)}
              </div>
              <div className="toolName" style={{ color: info.key === isHover ? '#666fff' : '' }}>
                {info.name}
              </div>
            </Popconfirm>
          </div>
        </Col>
      ))}
    </div>
  );
};

const mapStateToProps = (state: AppState) => {
  const stepInfo = StepUtils.getCurrentStepInfo(
    state.annotation?.step,
    state.annotation?.stepList,
  );

  return {
    toolInstance: state.annotation.toolInstance,
    stepInfo,
    imgList: state.annotation.imgList,
    imgIndex: state.annotation.imgIndex,
  };
};

export default connect(mapStateToProps)(GenerationOperation);