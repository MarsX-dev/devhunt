import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { IconNewsletterEnvolpe } from '@/components/Icons';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';

function isValidEmail(email: string) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

export default ({ isActive, closeModal }: { isActive: boolean; closeModal: (val: boolean) => void }) => {
  const [personalEMail, setPersonalEMail] = useState('');
  const [personalEMailError, setPersonalEMailError] = useState('');
  const [isLoad, setLoad] = useState(false);
  const [isSubscribingDone, setSubscribingDone] = useState(false);

  const handleSubmit: FormEventHandler = e => {
    e.preventDefault();
    setPersonalEMailError('');
    if (!isSubscribingDone) {
      if (isValidEmail(personalEMail)) {
        setLoad(true);
        axios.post('/api/newsletter', { personalEMail }).then(res => {
          setLoad(false);
          setSubscribingDone(true);
          localStorage.setItem('isNewsletterActive', 'false');
        });
      } else setPersonalEMailError('Please enter valid email');
    } else {
      closeModal(false);
    }
  };

  return (
    <Modal variant="custom" className="p-6 overflow-hidden" isActive={isActive} onCancel={() => closeModal(false)}>
      <BlurBg />
      <div className="flex justify-end">
        <button onClick={() => closeModal(false)} className="relative z-10 p-1 rounded-md text-gray-400 hover:bg-slate-700 duration-150">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="text-center">
        <div className="absolute w-full -top-16"></div>
        <form onSubmit={handleSubmit} className="relative">
          <IconNewsletterEnvolpe />
          <h3 className="text-slate-50 font-semibold mt-6">Subscribe to DevHunt</h3>
          <p className="text-slate-300 mt-2">Get weekly email with best new dev tools</p>
          {!isSubscribingDone ? (
            <Input
              required
              autoFocus
              placeholder="Enter your email"
              onChange={e => setPersonalEMail((e.target as HTMLInputElement).value)}
              className="w-full mt-6 border-slate-700 bg-slate-900/70 hover:bg-slate-900/40 focus:bg-slate-900/40"
            />
          ) : (
            ''
          )}
          <span className="block mt-3 text-red-500 text-sm text-left">{personalEMailError}</span>
          <Button isLoad={isLoad} className="w-full mt-3 hover:bg-orange-400 active:scale-[0.99]">
            {isSubscribingDone ? <CheckIcon className="w-6 h-6 mx-auto" /> : 'Subscribe'}
          </Button>
        </form>
      </div>
    </Modal>
  );
};

const BlurBg = () => (
  <div className="absolute w-full -top-16">
    <svg width="471" height="151" viewBox="0 0 471 151" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g filter="url(#filter0_f_247_126)">
        <rect x="62" y="36" width="347" height="53" fill="url(#paint0_linear_247_126)" fill-opacity="0.15" />
      </g>
      <defs>
        <filter
          id="filter0_f_247_126"
          x="0"
          y="-26"
          width="471"
          height="177"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB"
        >
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="31" result="effect1_foregroundBlur_247_126" />
        </filter>
        <linearGradient id="paint0_linear_247_126" x1="235.5" y1="26.9787" x2="234.581" y2="134.098" gradientUnits="userSpaceOnUse">
          <stop stop-color="#334155" />
          <stop offset="0.0596354" stop-color="#D1D5DB" />
          <stop offset="0.693271" stop-color="#F97316" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);
