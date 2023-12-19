import { ReactNode } from 'react';

export default ({ children, ToolId }: { children: ReactNode; ToolId: number }) => {
  //   const cardRef = useRef(null);
  //   const isInView = useInView(cardRef, { once: true });

  //   if (isInView) {
  //     new ProductsService(createBrowserClient()).viewed(ToolId); // track views
  //   }
  return <li className="py-3">{children}</li>;
};
