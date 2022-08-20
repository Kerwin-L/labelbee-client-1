/*
 * Annotation Component
 * @Author: Laoluo luozefeng@sensetime.com
 * @Date: 2022-05-23 19:15:58
 * @LastEditors: Laoluo luozefeng@sensetime.com
 * @LastEditTime: 2022-05-24 10:43:53
 */

import React, { useContext, useRef, useEffect, useState } from 'react';
import AnnotationOperation from '@labelbee/lb-components';
import '@labelbee/lb-components/dist/index.css';
import { EIpcEvent } from '../constant/event';
import { AnnotationContext } from '../store';
import i18n from '@/i18n';
import axios from 'axios';
import { getBBox2Annotation, getBase64 } from './utils';
import { Button, Col, Input, message, Modal, Row, Select, Spin, Tooltip } from 'antd';
import { AnnotationView } from '@labelbee/lb-components';
import { QuestionCircleOutlined, ToolOutlined } from '@ant-design/icons';
import DataLoading from '@/components/DataLoading';

const electron = window.require && window.require('electron');
const ipcRenderer = electron?.ipcRenderer;

export interface IPredictionInfo {
  bboxes: number[][];
  scores: number[];
  success: boolean;
  txts: string[];
}

export interface IBackFlowReq {
  img_name: string;
  img_base64: string;
  bbox_id: string;
  bbox: number[];
}

const baseUrl = 'http://103.44.81.154:8000/';

/**
 * Showing the predictionInfo
 * @param param0
 * @returns
 */
const BackFlowModal = ({
  imgSrc,
  annotations,
  predictInfo,
  onCancel,
  basicReq,
}: {
  imgSrc?: number;
  annotations?: any[];
  predictInfo: IPredictionInfo;
  basicReq: IBackFlowReq;
  onCancel: () => void;
}) => {
  const [answer, setAnswer] = useState('');
  const [updateIndex, setUpdateIndex] = useState(0);

  if (!annotations) {
    return null;
  }
  const backflow = () => {
    if (!answer) {
      message.info('输入不允许为空');
      return;
    }

    const backflowUrl = `${baseUrl}backflow`;
    axios.post(backflowUrl, { ...basicReq, person_anno: answer }).then((res) => {
      if (res.data.success) {
        message.success(`传输成功，请继续进行标注`);
        onCancel();
      } else {
        message.error(`传输失败, 请检查网络是否通畅, 请重试`);
      }
    });
  };
  return (
    <Modal
      width={800}
      visible={true}
      title='算法预测校验'
      footer={<Button onClick={onCancel}>取消</Button>}
      onCancel={onCancel}
    >
      <AnnotationView size={{ width: 720, height: 300 }} src={imgSrc} annotations={annotations} />
      <div style={{ marginTop: 20 }}>
        {predictInfo.txts.map((v, i) => (
          <Row key={i}>
            <Col span={12}>
              <div>
                {/* {i + 1} -  */}
                模型预测结果: {v}
              </div>
            </Col>
            <Col span={12}>
              <div>准确率：{predictInfo.scores[i]}</div>
            </Col>
          </Row>
        ))}

        {/* <div>
          如果预测结果与图内标注不向
        </div> */}
        <header style={{ margin: '20px 0 ', fontSize: 16, fontWeight: 500 }}>
          数据更改:
          <Tooltip title='仅预测结果与图内标注信息不符才续填写'>
            <QuestionCircleOutlined style={{ marginLeft: '10px' }} />
          </Tooltip>
        </header>
        <div style={{ display: 'flex' }}>
          {/* 以 index 来的控制 */}
          {/* <Select
            style={{ width: 100 }}
            defaultValue={updateIndex}
            onChange={(v) => setUpdateIndex(v)}
          >
            {annotations.map((_: any, i: number) => {
              return <Select.Option value={i}>{i + 1}</Select.Option>;
            })}
          </Select> */}
          <Input
            style={{ width: 600 }}
            placeholder='如果模型预测结果与图内标注信息不符，请输入正确值'
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <Tooltip title='提交更改后的数据给后端，优化预测模型'>
            <Button type='primary' onClick={backflow}>
              提交数据
            </Button>
          </Tooltip>
        </div>
      </div>
    </Modal>
  );
};

const Annotation = (props: any) => {
  const {
    dispatch,
    state: { currentProjectInfo, projectList, fileList },
  } = useContext(AnnotationContext);
  const cacheProjectList = useRef(projectList); // TODO: I will rewrite by custom hook later
  const [devFileList, setDevFileList] = useState(fileList);
  const [imgIndex, setImgIndex] = useState(currentProjectInfo?.imgIndex ?? 0);
  const [predictList, setPredictList] = useState<any[]>([]);
  const [showPredict, setShowPredict] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<any>();

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        if (!ref.current?.toolInstance) {
          return;
        }

        const toolInstance = ref.current?.toolInstance;
        toolInstance?.singleOn('createData', (newData: any) => {
          const predictUrl = `${baseUrl}predict`;

          const currentData = devFileList[imgIndex];
          const img_name = devFileList[imgIndex].fileName;

          let { x, y, width, height } = newData;
          x = Math.floor(x);
          y = Math.floor(y);
          width = Math.floor(width);
          height = Math.floor(height);

          const bbox: [number, number, number, number] = [x, y, x + width, y + height];

          const crop = true;

          setLoading(true);
          getBase64(currentData.url, (img_base64) => {
            axios
              .post(predictUrl, {
                img_name,
                img_base64,
                bbox,
                crop,
              })
              .then((res) => {
                console.log(res.data);
                const newAnnotation = getBBox2Annotation(res.data.bboxes, res.data.txts, {
                  crop,
                  cropBBox: bbox,
                });

                predictList[imgIndex] = {
                  currentData,
                  originBBox: bbox,
                  basicReq: {
                    img_name,
                    img_base64,
                    bbox_id: newData.id,
                    bbox,
                  },
                  predictInfo: res.data,
                  annotations: [...newAnnotation],
                };
                setPredictList([...predictList]);
                setLoading(false);
                setShowPredict(true);
              })
              .catch((err) => {
                console.error(err);
                setLoading(false);
                message.error('模型错误');
              });
          });
        });
      }, 100);
    }
  }, [ref.current, imgIndex]);

  const onSubmit = (data: any[], submitType: any, i: number) => {
    // 翻页时触发当前页面数据的输出
    if (ipcRenderer) {
      // 翻页时触发数据保存
      ipcRenderer.send(
        EIpcEvent.SaveResult,
        data,
        currentProjectInfo?.path,
        currentProjectInfo?.resultPath,
      );
    }
  };

  const goBack = (imgList: any[]) => {
    dispatch({
      type: 'UPDATE_CURRENT_PROJECTINFO',
      payload: {
        projectInfo: undefined,
      },
    });

    // 清空默认操作
    dispatch({
      type: 'UPDATE_FILE_LIST',
      payload: {
        fileList: [],
      },
    });
  };

  const updateProjectInfo = (info: { imgIndex?: number; step?: number }) => {
    // Notice:  The value of context(e.g. projectList) is not updated
    const newProjectList = cacheProjectList.current.map((item) => {
      return item.id === currentProjectInfo?.id ? { ...item, ...info } : item;
    });
    cacheProjectList.current = newProjectList; // need to update
    dispatch({
      type: 'UPDATE_PROJECT_LIST',
      payload: { projectList: newProjectList },
    });
  };

  const onPageChange = (imgIndex: number) => {
    // 保存当前页数到本地
    setShowPredict(false);
    setImgIndex(imgIndex);
    updateProjectInfo({ imgIndex });
  };

  const onStepChange = (step: number) => {
    // 保存当前步骤到本地
    updateProjectInfo({ step });
  };

  const loadFileList = (page: number, size: number) => {
    return new Promise((resolve) => {
      const currentList = fileList.slice(page * size, (page + 1) * size);
      ipcRenderer.send(
        EIpcEvent.GetFileListResult,
        currentList,
        currentProjectInfo?.path,
        currentProjectInfo?.resultPath,
      );
      ipcRenderer.once(EIpcEvent.GetFileListResultReply, (event: any, newFileList: any[]) => {
        const fileList = newFileList.map((file: any) => ({ ...file, url: 'file:///' + file.url }));
        setDevFileList(fileList);

        resolve({
          fileList,
          total: fileList.length,
        });
      });
    });
  };

  const currentPrediction = predictList[imgIndex];

  return (
    <div>
      <Spin
        spinning={loading}
        // indicator={<DataLoading style={{ width: '100%', height: '100vh' }} />}
        size='large'
      >
        <div>
          <AnnotationOperation
            ref={ref}
            headerName={currentProjectInfo?.name}
            onSubmit={onSubmit}
            onPageChange={onPageChange}
            onStepChange={onStepChange}
            loadFileList={loadFileList}
            goBack={goBack}
            stepList={currentProjectInfo?.stepList}
            step={currentProjectInfo?.step}
            defaultLang={i18n.language}
            initialIndex={currentProjectInfo?.imgIndex}
            showTips={true}
          />
          {showPredict ? (
            <BackFlowModal
              imgSrc={currentPrediction.currentData?.url}
              annotations={currentPrediction.annotations}
              predictInfo={currentPrediction.predictInfo}
              basicReq={currentPrediction.basicReq}
              onCancel={() => {
                setShowPredict(false);
              }}
            />
          ) : (
            ''
          )}
        </div>
      </Spin>
    </div>
  );
};
export default Annotation;
