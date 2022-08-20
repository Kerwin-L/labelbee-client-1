import React from 'react';
import LoadingGif from '@/assets/loading.gif';

interface IProps {
  message?: string;
  style?: any;
}

const DataLoading = ({ message = 'Wait a minute ~ Data Loading..', style = {} }: IProps) => {
  return (
    <div style={style}>
      <div>
        <img style={{ height: 50 }} src={LoadingGif} alt='loading' />
      </div>
      <div style={{ marginTop: 20 }}>{message}</div>
    </div>
  );
};
export default DataLoading;
