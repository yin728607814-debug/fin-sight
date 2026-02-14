/**
 * 下载页面截图按钮组件
 * 用于将整个页面截图并下载为图片
 */

import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface DownloadPageButtonProps {
  pageName: string; // 页面名称，用于文件名
  className?: string;
}

export const DownloadPageButton: React.FC<DownloadPageButtonProps> = ({ 
  pageName,
  className = ''
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // 获取整个页面的根元素
      const element = document.body;
      
      // 显示提示
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] animate-fade-in';
      toast.textContent = '正在生成截图...';
      document.body.appendChild(toast);
      
      // 等待一小段时间确保所有内容都已渲染
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 生成截图
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // 提高清晰度
        useCORS: true, // 允许跨域图片
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        allowTaint: true
      });
      
      // 更新提示
      toast.textContent = '正在保存图片...';
      
      // 转换为图片并下载
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = new Date().toISOString().split('T')[0];
          link.download = `${pageName}-${timestamp}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          
          // 显示成功提示
          toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] animate-fade-in';
          toast.textContent = '✅ 图片已保存！';
          
          setTimeout(() => {
            toast.remove();
          }, 2000);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('截图失败:', error);
      
      // 显示错误提示
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] animate-fade-in';
      errorToast.textContent = '❌ 截图失败，请重试';
      document.body.appendChild(errorToast);
      
      setTimeout(() => {
        errorToast.remove();
      }, 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="下载整个页面为图片"
    >
      <ArrowDownTrayIcon className={`h-5 w-5 ${isDownloading ? 'animate-bounce' : ''}`} />
      <span>{isDownloading ? '生成中...' : '下载图片'}</span>
    </button>
  );
};
