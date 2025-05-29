import Script from 'next/script';
import Modal from './Modal';

export default ({ isActive, toolName, email }: { isActive: boolean; toolName: string; email?: string }) => (
  <>
    <Modal variant="custom" isActive={isActive} className="bg-white">
      <iframe
        loading="lazy"
        id="rapidforms-iframe"
        src={`https://app.rapidforms.co/embed/9365a8?Tool%20name=${toolName}&Email=${email}`}
        width="100%"
        height="550px"
        frameBorder="0"
      ></iframe>
    </Modal>
    <Script strategy="beforeInteractive" src="https://app.rapidforms.co/embed/index.js" />
  </>
);
