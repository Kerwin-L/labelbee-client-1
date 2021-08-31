const rectToolConfig = {
  showConfirm: false,
  skipWhileNoDependencies: false,
  drawOutsideTarget: false,
  copyBackwardResult: true,
  minWidth: 1,
  minHeight: 1,
  isShowOrder: true,
  filterData: ['valid', 'invalid'],
  attributeConfigurable: true,
  attributeList: [
    { key: '玩偶', value: 'doll' },
    { key: '喷壶', value: 'wateringCan' },
    { key: '脸盆', value: 'washbasin' },
    { key: '保温杯', value: 'vacuumCup' },
    { key: '纸巾', value: 'tissue' },
    { key: '水壶', value: 'kettle' },
  ],
  textConfigurable: true,
  textCheckType: 0,
  customFormat: '',
};

const tagToolConfig = {
  showConfirm: true,
  skipWhileNoDependencies: false,
  inputList: [
    {
      key: '类别1',
      value: 'class1',
      isMulti: false,
      subSelected: [
        { key: '选项1', value: 'option1', isDefault: false },
        { key: '选项2', value: 'option1-2', isDefault: false },
      ],
    },
    {
      key: '类别2',
      value: 'class-AH',
      isMulti: true,
      subSelected: [
        { key: '选项2-1', value: 'option2-1', isMulti: false },
        { key: '选项2-2', value: 'option2-2', isDefault: false },
        { key: '选项2-3', value: 'option2-3', isDefault: false },
      ],
    },
    {
      key: '类别3',
      value: 'class-0P',
      isMulti: false,
      subSelected: [
        { key: '选项3-1', value: 'option3-1', isMulti: false },
        { key: '选项3-2', value: 'option3-2', isDefault: false },
        { key: '选项3-3', value: 'option3-3', isDefault: false },
      ],
    },
  ],
};

const lineToolConfig = {
  lineType: 0,
  lineColor: 0,
  edgeAdsorption: true,
  outOfTarget: true,
  copyBackwardResult: true,
  isShowOrder: true,
  attributeConfigurable: true,
  attributeList: [
    { key: '类别1', value: '类别1' },
    { key: '类别ao', value: 'class-ao' },
    { key: '类别M1', value: 'class-M1' },
    { key: '类别Cm', value: 'class-Cm' },
    { key: '类别c3', value: 'class-c3' },
    { key: '类别a0', value: 'class-a0' },
    { key: '类别u7', value: 'class-u7' },
    { key: '类别Zb', value: 'class-Zb' },
    { key: '类别zi', value: 'class-zi' },
  ],
  textConfigurable: true,
  textCheckType: 2,
  customFormat: '',
  showConfirm: true,
  lowerLimitPointNum: 2,
  upperLimitPointNum: '',
  preReferenceStep: 0,
  skipWhileNoDependencies: false,
  filterData: ['valid', 'invalid'],
};

const textToolConfig = {
  showConfirm: false,
  skipWhileNoDependencies: false,
  enableTextRecognition: false,
  recognitionMode: 'general',
  configList: [
    { label: '文本', key: 'text', required: false, default: '从现在', maxLength: 1000 },
    { label: '文本2', key: 'text2', required: true, default: '多少啊', maxLength: 1000 },
    { label: '文本3', key: 'text3', required: true, default: '2431阿斯顿23', maxLength: 1000 },
  ],
  filterData: ['valid', 'invalid'],
};

const polygonConfig = {
  lineType: 0,
  lineColor: 0,
  lowerLimitPointNum: 3,
  upperLimitPointNum: 20,
  edgeAdsorption: true,
  drawOutsideTarget: false,
  copyBackwardResult: false,
  isShowOrder: false,
  attributeConfigurable: true,
  attributeList: [
    { key: '类别1', value: '类别1' },
    { key: '类别tT', value: 'class-tT' },
    { key: '类别FM', value: 'class-FM' },
    { key: '类别r6', value: 'class-r6' },
    { key: '类别Rs22222类别Rs22222', value: 'class-Rs' },
    { key: '类别rp', value: 'class-rp' },
    { key: '类别rp2', value: 'class-rp2' },
    { key: '类别rp3', value: 'class-rp3' },
    { key: '类别Rs4', value: 'class-Rs4' },
    { key: '类别rp5', value: 'class-rp5' },
  ],
  textConfigurable: true,
  textCheckType: 0,
  customFormat: '',
};

export const getConfig = (tool) => {
  if (tool === 'lineTool') {
    return lineToolConfig;
  }

  if (tool === 'rectTool') {
    return rectToolConfig;
  }

  if (tool === 'tagTool') {
    return tagToolConfig;
  }

  if (tool === 'textTool') {
    return textToolConfig;
  }

  if (tool === 'polygonTool') {
    return polygonConfig;
  }

  return rectToolConfig;
};

export const getStepList = (tool) => {
  return [
    {
      step: 1,
      dataSourceStep: 0,
      tool: tool ?? 'rectTool',
      config: JSON.stringify(getConfig(tool)),
    },
  ];
};