import React from 'react';

export type SvgProps = {
  width?: number;
  height?: number;
  color?: string;
  classname?: string;
};

export type SvgType = React.FC<SvgProps>;
