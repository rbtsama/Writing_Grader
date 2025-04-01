# 英语作文批改系统

这是一个使用React和OpenRouter API构建的英语作文批改应用，可以通过上传学生手写作文的图片来进行自动批改。

## 功能特点

- 上传学生手写作文图片
- 调用DeepSeek-Chat模型进行作文批改
- 保存历史记录
- 本地存储API密钥

## 技术栈

- React.js
- Next.js
- Tailwind CSS
- OpenRouter API (DeepSeek-Chat模型)

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/yourusername/essay-correction-app.git
cd essay-correction-app
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:3000

## 使用方法

1. 在设置中输入你的OpenRouter API密钥
2. 输入学生姓名
3. 上传作文图片
4. 点击"开始批改"按钮
5. 查看批改结果

## 部署

该应用可以直接部署到Vercel平台：

```bash
npm install -g vercel
vercel
``` 