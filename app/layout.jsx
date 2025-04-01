import './globals.css';
import { ToastProvider } from './components/ui/toast';

export const metadata = {
  title: '英语作文批改系统',
  description: '使用AI批改英语作文，提供详细的错误分析和改进建议',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
} 