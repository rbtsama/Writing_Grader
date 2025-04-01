# Luna Writing Grader

![Luna Writing Grader](https://i.imgur.com/XXXXX.png)

## 项目介绍

Luna Writing Grader 是一个智能英语作文批改系统，专为英语教师设计，能够快速批改学生的英语作文，提供详细的修改建议和优化建议。系统通过OpenRouter API集成大型语言模型，能够识别语法错误、中式英语表达，并提供地道的表达方式建议。

## 功能特点

- 🖼️ **图片上传**：支持上传手写或打印的英语作文图片
- 🤖 **智能批改**：自动识别作文中的错误并提供修改建议
- 📝 **详细反馈**：分类展示修改建议和优化建议
- 👨‍👩‍👧‍👦 **学生管理**：支持管理不同班级的学生名单
- 📊 **批改历史**：保存最近200条批改记录，方便查阅和对比

## 技术栈

- **前端框架**：Next.js、React
- **UI组件**：Tailwind CSS
- **图标库**：Lucide React
- **AI接口**：OpenRouter API (基于大型语言模型)

## 本地开发

```bash
# 克隆项目
git clone https://github.com/rbtsama/Writing_Grader.git

# 安装依赖
cd Writing_Grader
npm install

# 启动开发服务器
npm run dev
```

## 部署

本项目已部署在Vercel上，您可以通过以下链接访问：

[https://writing-grader.vercel.app](https://writing-grader.vercel.app)

## 鸣谢

- 感谢OpenRouter提供强大的AI接口
- 感谢Next.js和Tailwind CSS提供优秀的开发框架和工具

## 许可证

MIT 