"use client"

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const HandLoading = () => {
  return (
    <DotLottieReact
      src="/loading.lottie"
      loop
      autoplay
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default HandLoading;