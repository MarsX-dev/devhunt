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
    <div className="py-2 text-center">
      <a
        target="_blank"
        href="https://rapidforms.co"
        className="p-2 rounded-full text-sm font-medium catchy-border text-zinc-600 hover:text-indigo-600 duration-150"
      >
        Build your form with RapidForms
      </a>
    </div>
    <Script strategy="beforeInteractive" src="https://app.rapidforms.co/embed/index.js" />
  </>
);
