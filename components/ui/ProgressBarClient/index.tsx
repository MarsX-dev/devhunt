'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default () => {
  return (
    <>
      <ProgressBar height="2px" color="#f97316" options={{ showSpinner: false }} shallowRouting />
    </>
  );
};
