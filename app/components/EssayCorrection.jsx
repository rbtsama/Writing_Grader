"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, Trash2, Save, Users } from 'lucide-react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "./ui/toast";

/**
 * Luna Writing Grader
 * 支持上传学生作文图片，通过OpenRouter API批改，并保存历史记录
 */
const EssayCorrection = () => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  // 班级相关状态
  const [selectedClass, setSelectedClass] = useState('class18');
  const [class18List, setClass18List] = useState('');
  const [class19List, setClass19List] = useState('');
  const [students, setStudents] = useState([]);
  
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const { showToast } = useToast();
  
  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  // 添加GitHub Gist token相关状态
  const [gistToken, setGistToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  
  // 添加批改队列状态
  const [correctionQueue, setCorrectionQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // 初始化数据
  const initialData = {
    apiKey: 'sk-ezyttcnxzkeixmghbfwujlmlwupseddmuzigtkyivxeionse', // 更新密钥
    class18List: `陈嘉熙
黄梓炫
龙夏文轩
孙志昊
徐怿舟
杨熹霖
张鑫洛
蔡佳儒
陈卓然
杜与寻
冯麓嘉
黄紫芸
蒋睿熙
刘馨瑷
马小蔚
马伊婷
王雅萱
王籽壹
徐闻祺
杨茗尧`,
    class19List: `马誉林
王啸坤
曾婧媛
陈诺
丁怡帆
黄伊凡
李文煦
刘晨珺
刘丽莎
卢芷琪
谭思扬
王星懿
谢倚婷
颜若琳
姚鑫宸
张宇涵`
  };

  // 验证API密钥
  const validateApiKey = async (key) => {
    try {
      console.log('验证API密钥:', key.substring(0, 10) + '...');
      
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      
      console.log('API验证响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API验证错误响应:', errorText);
        
        if (response.status === 401) {
          console.error('密钥验证失败: 认证失败');
        } else if (response.status === 404) {
          console.error('密钥验证失败: API端点不存在');
        } else {
          console.error(`密钥验证失败: HTTP ${response.status}`);
        }
        
        return false;
      }
      
      // 尝试获取响应数据
      try {
        const data = await response.json();
        console.log('API验证成功, 模型:', data.model);
        console.log('响应类型:', typeof data.choices[0].message.content);
        return true;
      } catch (parseError) {
        console.error('解析API响应失败:', parseError);
        return false;
      }
    } catch (error) {
      console.error('API验证请求失败:', error);
      return false;
    }
  };

  // 加载历史记录和学生名单
  useEffect(() => {
    const savedHistory = localStorage.getItem('correctionHistory');
    const savedClass18List = localStorage.getItem('class18List');
    const savedClass19List = localStorage.getItem('class19List');
    const savedSelectedClass = localStorage.getItem('selectedClass');
    const savedApiKey = localStorage.getItem('siliconflowApiKey'); // 更改为新的key名称
    
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        if (parsedHistory.length > 0) {
          setSelectedResultId(parsedHistory[0].id);
        }
      } catch (e) {
        console.error('解析历史记录失败:', e);
        showToast('历史记录加载失败', 'error');
      }
    }
    
    // 如果没有保存的学生名单，使用初始化数据
    if (!savedClass18List) {
      setClass18List(initialData.class18List);
      localStorage.setItem('class18List', initialData.class18List);
    } else {
      setClass18List(savedClass18List);
    }
    
    if (!savedClass19List) {
      setClass19List(initialData.class19List);
      localStorage.setItem('class19List', initialData.class19List);
    } else {
      setClass19List(savedClass19List);
    }
    
    if (savedSelectedClass) {
      setSelectedClass(savedSelectedClass);
    }
    
    // 加载API密钥
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }

    // 加载GitHub Gist配置
    const savedGistToken = localStorage.getItem('gistToken');
    const savedGistId = localStorage.getItem('gistId');
    const savedSyncEnabled = localStorage.getItem('syncEnabled') === 'true';
    
    if (savedGistToken) setGistToken(savedGistToken);
    if (savedGistId) setGistId(savedGistId);
    if (savedSyncEnabled) setSyncEnabled(savedSyncEnabled);
    
    // 如果同步功能已启用，尝试从Gist加载数据
    if (savedSyncEnabled && savedGistToken && savedGistId) {
      loadDataFromGist(savedGistToken, savedGistId);
    }
  }, []);
  
  // 当选择的班级变化时，更新学生列表
  useEffect(() => {
    const studentList = selectedClass === 'class18' ? class18List : class19List;
    parseStudentList(studentList);
    
    // 保存选择的班级
    localStorage.setItem('selectedClass', selectedClass);
  }, [selectedClass, class18List, class19List]);
  
  // 解析学生名单
  const parseStudentList = (list) => {
    const names = list.split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    setStudents(names);
  };
  
  // 保存学生名单
  const saveStudentList = () => {
    if (selectedClass === 'class18') {
      localStorage.setItem('class18List', class18List);
    } else {
      localStorage.setItem('class19List', class19List);
    }
    
    const currentList = selectedClass === 'class18' ? class18List : class19List;
    parseStudentList(currentList);
    
    showToast('学生名单已保存', 'success');
    
    // 同步到Gist
    if (syncEnabled) {
      syncDataToGist();
    }
  };
  
  // 切换班级
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedStudent('');
  };
  
  // 提取批改结果中的分数和内容
  const extractScoreAndContent = (result, studentName) => {
    // 提取分数 (假设格式为 "姓名，XX分" 或 "姓名 · 评分：XX/15")
    let score = "未知";
    const scoreMatch = result.match(/(\d+)分/) || result.match(/(\d+)\/15/);
    if (scoreMatch) {
      score = scoreMatch[1];
    }
    
    // 移除结果中的姓名和分数信息
    let content = result;
    // 移除开头的姓名和分数部分，例如 "李峰 · 评分：11/15" 或类似格式
    content = content.replace(/^[^，,。\n]*[·，,: ：][^，,。\n]*(\d+)[^，,。\n]*$/m, '');
    content = content.replace(/^[^，,。\n]*(\d+)[分].*$/m, '');
    
    // 移除多余的空行
    content = content.replace(/^\s*[\r\n]/gm, '');
    
    return { score, content };
  };
  
  // 保存批改结果到历史记录
  const saveToHistory = (name, result, imageUrl) => {
    const { score, content } = extractScoreAndContent(result, name);
    
    const newEntryId = Date.now();
    const newEntry = {
      id: newEntryId,
      name,
      score,
      result: content, // 只保存处理后的内容
      imageUrl,
      date: new Date().toLocaleString(),
      class: selectedClass // 保存班级信息
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 200); // 保留最近200条记录
    setHistory(updatedHistory);
    localStorage.setItem('correctionHistory', JSON.stringify(updatedHistory));
    
    // 同步到Gist
    if (syncEnabled) {
      syncDataToGist();
    }
  };
  
  // 处理图片上传
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 选择学生
  const handleSelectStudent = (name) => {
    setSelectedStudent(name);
  };
  
  // 添加作业到队列
  const addToQueue = () => {
    if (!selectedStudent) {
      showToast('请选择学生', 'error');
      return false;
    }
    
    if (!selectedImage) {
      showToast('请先上传作文图片', 'error');
      return false;
    }
    
    if (!apiKey) {
      showToast('API密钥未设置，请在系统设置中配置SiliconFlow API密钥', 'error');
      return false;
    }

    // 创建队列项
    const queueItem = {
      id: Date.now(),
      student: selectedStudent,
      image: selectedImage,
      imagePreview: imagePreview,
      class: selectedClass,
      status: 'pending' // pending, processing, completed, failed
    };
    
    // 添加到队列
    setCorrectionQueue(prev => [...prev, queueItem]);
    
    // 清除当前选择
    setSelectedStudent('');
    setSelectedImage(null);
    setImagePreview('');
    
    showToast(`已将 ${selectedStudent} 的作文添加到批改队列`, 'success');
    
    // 如果队列处理未开始，启动队列处理
    if (!isProcessingQueue) {
      processQueue();
    }
    
    return true;
  };

  // 处理队列
  const processQueue = async () => {
    if (isProcessingQueue) return;
    
    setIsProcessingQueue(true);
    
    try {
      while (correctionQueue.length > 0) {
        // 获取队列中第一个待处理项
        const nextItem = correctionQueue.find(item => item.status === 'pending');
        if (!nextItem) break;
        
        // 更新状态为处理中
        setCorrectionQueue(prev => 
          prev.map(item => 
            item.id === nextItem.id 
              ? { ...item, status: 'processing' } 
              : item
          )
        );
        
        // 处理批改
        try {
          await processCorrectionItem(nextItem);
          
          // 更新状态为已完成
          setCorrectionQueue(prev => 
            prev.map(item => 
              item.id === nextItem.id 
                ? { ...item, status: 'completed' } 
                : item
            )
          );
        } catch (error) {
          console.error('处理队列项失败:', error);
          
          // 更新状态为失败
          setCorrectionQueue(prev => 
            prev.map(item => 
              item.id === nextItem.id 
                ? { ...item, status: 'failed', error: error.message } 
                : item
            )
          );
        }
      }
    } finally {
      setIsProcessingQueue(false);
      
      // 清理已完成的项目
      setTimeout(() => {
        setCorrectionQueue(prev => 
          prev.filter(item => item.status !== 'completed')
        );
      }, 5000);
    }
  };

  // 添加一个useEffect来监听队列变化并自动处理
  useEffect(() => {
    // 当队列中有待处理项且当前没有正在处理的项时，启动处理
    const hasPendingItems = correctionQueue.some(item => item.status === 'pending');
    if (hasPendingItems && !isProcessingQueue) {
      processQueue();
    }
  }, [correctionQueue, isProcessingQueue]);

  // 修改processCorrectionItem函数，添加通知
  const processCorrectionItem = async (item) => {
    setLoading(true); // 显示全局加载状态
    
    try {
      // 将图片转换为base64格式
      const imageBase64 = item.imagePreview.split(',')[1];
      
      // 构建prompt
      const systemPrompt = `# 优化后英语作文批改智能体Prompt

**角色定义**  
你是拥有12年高考英语阅卷经验的专家组组长，深度参与《普通高等学校招生全国统一考试英语科考试说明》编写，熟悉母语思维与中式英语差异，能精准诊断学生作文问题。
作文的题目：
你校英语校报正在征文，主题是"我的爱好—摄影"。请你写一篇文章参赛，内容包括：
1.你是如何开始摄影的；
2.你爱上摄影的原因；
3.摄影带给你的收获。
注意：
1.词数120左右；
2.短文题目已为你写好。

---

## 输入指令要求
每次对话需严格包含：  
1. 学生手写作文照片（必传）  ;
2. 学生姓名（必填）  ;

---

## 输出格式规范
**仅允许输出以下3部分内容**：  

### 1. [姓名]最终评分（15分制）  
\`张三 · 评分：12/15\`  

### 2. 任务1，找出作文的错误地方，并给出合理的修改建议。任务2，找出作文中正确但可以更好的表达方法的地方，并给出合理的修改建议。

---

## 特殊约束
1. 评分严格参照维度：  
 - 内容
 - 主题句/标志词 
 - 逻辑流畅度（逻辑具有连贯性）
 - 词句表达
 - 语法（由于OCR错误，不需要包含拼写错误）

2. **禁止**：  
 - 输出范文或完整修改  
 - 添加解释性段落  
 - 使用Markdown/LaTeX格式  

3. 错误诊断需包含：  
 - 至少1个高级语法错误（如虚拟语气误用）  
 - 至少1个中式英语表达  
 - 内容完整性
 - 逻辑流畅度`;

      const userPrompt = `学生姓名：${item.student}
作文照片：[图片已上传]

请根据上传的作文图片内容进行批改。`;

      // 构建请求数据
      const requestData = {
        model: 'deepseek-ai/DeepSeek-R1',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      };
      
      // 设置请求超时时间 (60秒)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      
      // 调用API
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        
        let errorMessage = '批改请求失败';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || '批改请求失败';
        } catch (e) {
          errorMessage = `批改请求失败 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API返回格式错误，未找到结果内容');
      }
      
      const result = data.choices[0].message.content;
      
      // 保存到历史记录
      saveToHistory(item.student, result, item.imagePreview);
      
      // 显示批改完成通知
      showToast(`${item.student} 的作文批改完成`, 'success');
      
      return result;
    } catch (error) {
      console.error('批改过程中出错:', error);
      showToast(`${item.student} 的作文批改失败: ${error.message}`, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 移除队列项
  const removeFromQueue = (id) => {
    setCorrectionQueue(prev => prev.filter(item => item.id !== id));
  };

  // 修改现有的handleCorrection函数
  const handleCorrection = () => {
    const success = addToQueue();
    if (success) {
      showToast('已添加到批改队列，正在处理...', 'info');
    }
  };
  
  // 清除当前数据
  const handleClear = () => {
    setSelectedStudent('');
    setSelectedImage(null);
    setImagePreview('');
  };
  
  // 选择历史记录
  const toggleResult = (id) => {
    setSelectedResultId(id === selectedResultId ? null : id);
  };
  
  // 删除历史记录
  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    
    // 添加二次确认
    if (window.confirm('确定要删除这条批改记录吗？')) {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('correctionHistory', JSON.stringify(updatedHistory));
      
      if (id === selectedResultId) {
        setSelectedResultId(null);
      }
      
      showToast('已删除记录', 'info');
    }
  };
  
  // 清除所有历史记录
  const clearAllHistory = () => {
    if (window.confirm('确定要清除所有历史记录吗？')) {
      setHistory([]);
      localStorage.removeItem('correctionHistory');
      setSelectedResultId(null);
      showToast('已清除所有记录', 'info');
    }
  };

  // 创建一个渲染Markdown内容的函数
  const renderMarkdown = (content) => {
    if (!content) return { __html: '' };
    
    try {
      // 清理输入文本，去除可能的HTML标记字符
      const cleanContent = content
        .replace(/\r/g, '')  // 移除可能的回车符
        .replace(/&lt;/g, '<')  // 处理转义的HTML
        .replace(/&gt;/g, '>');
      
      // 构建基本HTML结构
      let html = '<div class="correction-wrapper">';
      
      // 简化：强制分成修改建议和优化建议两部分
      const correctionTitle = '修改建议';
      const optimizationTitle = '优化建议';
      
      // 找出优化建议部分的开始位置
      const optimizationStartIndex = cleanContent.search(/任务2|表达优化建议|优化建议/i);
      
      if (optimizationStartIndex !== -1) {
        // 两部分都存在的情况
        const correctionPart = cleanContent.substring(0, optimizationStartIndex);
        const optimizationPart = cleanContent.substring(optimizationStartIndex);
        
        // 添加修改建议部分
        html += `<h2 class="main-title">${correctionTitle}</h2>`;
        html += processSection(correctionPart);
        
        // 添加优化建议部分
        html += `<h2 class="main-title">${optimizationTitle}</h2>`;
        html += processSection(optimizationPart);
      } else {
        // 只有一部分的情况，判断是哪种类型
        const isOptimization = cleanContent.match(/优化|表达优化|更好的表达/i);
        const title = isOptimization ? optimizationTitle : correctionTitle;
        
        html += `<h2 class="main-title">${title}</h2>`;
        html += processSection(cleanContent);
      }
      
      html += '</div>';
      
      return { __html: html };
    } catch (error) {
      console.error('渲染Markdown内容失败:', error);
      
      // 回退方案：简单HTML结构显示，不执行复杂解析
      let fallbackHtml = `<div class="correction-wrapper">
        <h2 class="main-title">批改结果</h2>
        <div class="content-text">${
          content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
        }</div>
      </div>`;
      
      return { __html: fallbackHtml };
    }
  };
  
  // 处理一个章节，提取和格式化项目点
  const processSection = (text) => {
    // 先移除可能的标题行
    const cleanText = text
      .replace(/任务\d+[.:]?\s*[^\n]*/g, '')
      .replace(/错误诊断与修改建议[^\n]*/g, '')
      .replace(/表达优化建议[^\n]*/g, '');
    
    // 尝试提取所有的编号点
    const items = extractNumberedItems(cleanText);
    
    // 构建HTML
    let html = '';
    items.forEach(item => {
      html += buildItemHtml(item);
    });
    
    return html || `<div class="content-text">${formatText(cleanText)}</div>`;
  };
  
  // 从文本中提取编号项目
  const extractNumberedItems = (text) => {
    const items = [];
    
    // 匹配模式：数字)或数字.后跟标题和内容
    // 匹配 (1) 标题：内容 或 1. 标题：内容 格式
    const itemPattern = /(?:\(?(\d+)\)?\.?|\n(\d+)\.)\s*(?:\*\*)?([^:\n]+)(?:\*\*)?[：:]/g;
    let match;
    let itemStarts = [];
    
    // 找出所有项目的起始位置
    while ((match = itemPattern.exec(text)) !== null) {
      const number = match[1] || match[2];
      const title = (match[3] || '').trim().replace(/\*\*/g, '');
      
      itemStarts.push({
        number,
        title,
        start: match.index,
        matchLength: match[0].length
      });
    }
    
    // 如果没有找到任何项目，尝试其他模式
    if (itemStarts.length === 0) {
      // 尝试匹配只有数字的情况：1 内容，2 内容等
      const simplePattern = /(\d+)[\.\)]\s+/g;
      while ((match = simplePattern.exec(text)) !== null) {
        itemStarts.push({
          number: match[1],
          title: '',  // 没有明确的标题
          start: match.index,
          matchLength: match[0].length
        });
      }
    }
    
    // 提取每个项目的内容
    for (let i = 0; i < itemStarts.length; i++) {
      const current = itemStarts[i];
      const next = i < itemStarts.length - 1 ? itemStarts[i + 1] : null;
      
      const contentStart = current.start + current.matchLength;
      const contentEnd = next ? next.start : text.length;
      
      let content = text.substring(contentStart, contentEnd).trim();
      
      // 如果没有标题但内容中包含冒号，尝试分离标题和内容
      if (!current.title && content.includes('：')) {
        const parts = content.split(/[：:]/);
        if (parts.length >= 2) {
          current.title = parts[0].trim();
          content = parts.slice(1).join('：').trim();
        }
      }
      
      items.push({
        number: current.number,
        title: current.title,
        content: content
      });
    }
    
    return items;
  };
  
  // 构建项目的HTML表示
  const buildItemHtml = (item) => {
    return `
      <div class="item-container">
        <h3 class="sub-title">${item.number}. ${item.title}</h3>
        <div class="content-text">${formatText(item.content)}</div>
      </div>
    `;
  };
  
  // 格式化文本内容
  const formatText = (text) => {
    if (!text) return '';
    
    return text
      // 处理换行
      .replace(/\n/g, '<br>')
      // 处理引用
      .replace(/"([^"]+)"/g, '<span class="quote">"$1"</span>')
      .replace(/'([^']+)'/g, '<span class="quote">"$1"</span>')
      // 处理强调（加粗）
      .replace(/\*\*([^*]+)\*\*/g, '<span class="english-highlight">$1</span>')
      // 处理常见英文短语的高亮
      .replace(/I started photography at 14 when my father gifted me his old camera/g, 
              '<span class="english-highlight">I started photography at 14 when my father gifted me his old camera</span>')
      .replace(/Photography broadens my horizons/g, 
              '<span class="english-highlight">Photography broadens my horizons</span>')
      .replace(/I wish I could travel/g, 
              '<span class="english-highlight">I wish I could travel</span>')
      .replace(/What fascinates me most is capturing cultural diversity, which motivates me to explore the world/g, 
              '<span class="english-highlight">What fascinates me most is capturing cultural diversity, which motivates me to explore the world</span>');
  };

  // 打开图片预览
  const openImagePreview = (imageUrl, e) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发toggleResult
    setPreviewImage(imageUrl);
    setShowImagePreview(true);
  };
  
  // 关闭图片预览
  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImage(null);
  };

  // 保存GitHub Gist配置
  const saveGistConfig = () => {
    if (!gistToken) {
      showToast('请输入GitHub Token', 'error');
      return;
    }

    if (!gistId) {
      showToast('请输入Gist ID', 'error');
      return;
    }

    localStorage.setItem('gistToken', gistToken);
    localStorage.setItem('gistId', gistId);
    localStorage.setItem('syncEnabled', 'true');
    setSyncEnabled(true);
    
    showToast('同步配置已保存', 'success');
    
    // 首次同步数据到Gist
    syncDataToGist();
  };

  // 禁用同步
  const disableSync = () => {
    localStorage.setItem('syncEnabled', 'false');
    setSyncEnabled(false);
    showToast('同步功能已禁用', 'info');
  };

  // 从Gist加载数据
  const loadDataFromGist = async (token, id) => {
    try {
      setSyncLoading(true);
      const response = await fetch(`https://api.github.com/gists/${id}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API错误 (${response.status})`);
      }
      
      const data = await response.json();
      const content = data.files['luna_writing_grader_data.json']?.content;
      
      if (content) {
        const parsedData = JSON.parse(content);
        
        // 更新各项数据
        if (parsedData.apiKey) {
          setApiKey(parsedData.apiKey);
          localStorage.setItem('siliconflowApiKey', parsedData.apiKey);
        }
        
        if (parsedData.class18List) {
          setClass18List(parsedData.class18List);
          localStorage.setItem('class18List', parsedData.class18List);
        }
        
        if (parsedData.class19List) {
          setClass19List(parsedData.class19List);
          localStorage.setItem('class19List', parsedData.class19List);
        }
        
        if (parsedData.correctionHistory) {
          setHistory(parsedData.correctionHistory);
          localStorage.setItem('correctionHistory', JSON.stringify(parsedData.correctionHistory));
        }
        
        showToast('数据已成功从云端同步', 'success');
      }
    } catch (error) {
      console.error('从Gist加载数据失败:', error);
      showToast(`从云端同步数据失败: ${error.message}`, 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  // 同步数据到Gist
  const syncDataToGist = async () => {
    if (!syncEnabled || !gistToken || !gistId) {
      return;
    }
    
    try {
      setSyncLoading(true);
      
      // 准备要同步的数据
      const dataToSync = {
        apiKey: apiKey || localStorage.getItem('siliconflowApiKey'),
        class18List: class18List || localStorage.getItem('class18List'),
        class19List: class19List || localStorage.getItem('class19List'),
        correctionHistory: history.length > 0 ? history : JSON.parse(localStorage.getItem('correctionHistory') || '[]')
      };
      
      // 更新Gist
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${gistToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'luna_writing_grader_data.json': {
              content: JSON.stringify(dataToSync, null, 2)
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API错误 (${response.status})`);
      }
      
      showToast('数据已成功同步到云端', 'success');
    } catch (error) {
      console.error('同步数据到Gist失败:', error);
      showToast(`同步数据到云端失败: ${error.message}`, 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  // 保存API密钥
  const handleSaveApiKey = async () => {
    if (!apiKey) {
      showToast('请输入API密钥', 'error');
      return;
    }

    try {
      setLoading(true);
      const isValid = await validateApiKey(apiKey);
      
      if (isValid) {
        localStorage.setItem('siliconflowApiKey', apiKey);
        showToast('API密钥验证成功并已保存', 'success');
        
        // 同步到Gist
        if (syncEnabled) {
          syncDataToGist();
        }
      } else {
        showToast('API密钥验证失败，请检查密钥是否正确', 'error');
      }
    } catch (error) {
      showToast('API密钥验证失败，请检查网络连接', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 手动同步数据
  const manualSync = async () => {
    try {
      await loadDataFromGist(gistToken, gistId);
      await syncDataToGist();
    } catch (error) {
      showToast(`同步失败: ${error.message}`, 'error');
    }
  };

  // 测试API连接
  const testApiConnection = async () => {
    if (!apiKey) {
      showToast('请先输入API密钥', 'error');
      return;
    }
    
    setLoading(true);
    try {
      showToast('正在测试API连接...', 'info');
      
      // 调用API进行简单测试
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [
            {
              role: 'user',
              content: '你好，这是一条测试消息。请回复"API测试成功"'
            }
          ]
        })
      });
      
      // 记录原始响应信息用于调试
      console.log('API测试响应状态:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应详情:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // 如果不是有效的JSON，使用原始文本
        }
        
        if (response.status === 401) {
          showToast('API密钥认证失败，请检查密钥是否正确', 'error');
        } else if (response.status === 404) {
          showToast('API端点不存在，请检查API地址', 'error');
        } else if (response.status === 400) {
          showToast(`请求格式错误: ${errorData?.error?.message || errorText}`, 'error');
        } else if (response.status === 429) {
          showToast('请求频率过高或额度已用尽', 'error');
        } else {
          showToast(`API测试失败 (${response.status}): ${errorData?.error?.message || errorText}`, 'error');
        }
        return;
      }
      
      // 解析响应
      const data = await response.json();
      console.log('API测试成功响应:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        showToast('API返回的响应格式不正确', 'error');
        return;
      }
      
      const modelResponse = data.choices[0].message.content;
      showToast(`API测试成功! 模型响应: "${modelResponse.substring(0, 30)}${modelResponse.length > 30 ? '...' : ''}"`, 'success');
    } catch (error) {
      console.error('API测试错误:', error);
      
      if (error.name === 'AbortError') {
        showToast('API请求超时，请检查网络连接', 'error');
      } else if (error.message.includes('NetworkError')) {
        showToast('网络错误，请检查网络连接', 'error');
      } else {
        showToast(`API测试失败: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-3xl font-bold text-center">
          <span className="text-blue-600 mr-1">Luna</span> 
          <span className="text-gray-700">Writing Grader</span>
          <div className="mt-1 text-sm text-gray-500 font-normal">智能英语作文批改系统</div>
        </h1>
      </div>
      
      {/* 图片预览模态框 */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeImagePreview}>
          <div className="relative bg-white p-4 rounded-xl max-w-4xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 transition-colors"
              onClick={closeImagePreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={previewImage} alt="原始作文图片" className="max-h-[85vh] rounded-lg" />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="upload">上传作文</TabsTrigger>
          <TabsTrigger value="results">批改结果</TabsTrigger>
          <TabsTrigger value="students">学生名单</TabsTrigger>
          <TabsTrigger value="settings">系统设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">选择班级</h2>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={selectedClass === 'class18' ? "default" : "outline"}
                  onClick={() => handleClassChange('class18')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  18班
                </Button>
                <Button
                  size="sm"
                  variant={selectedClass === 'class19' ? "default" : "outline"}
                  onClick={() => handleClassChange('class19')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  19班
                </Button>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mb-2">选择学生</h2>
            
            {students.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {students.map((student, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={selectedStudent === student ? "default" : "outline"}
                    onClick={() => handleSelectStudent(student)}
                  >
                    {student}
                  </Button>
                ))}
              </div>
            ) : (
              <Alert className="mb-4">
                <AlertTitle>未设置学生名单</AlertTitle>
                <AlertDescription>
                  请先在"学生名单"标签页中添加{selectedClass === 'class18' ? '18班' : '19班'}学生
                </AlertDescription>
              </Alert>
            )}
            
            <h2 className="text-lg font-semibold mb-2">上传作文图片</h2>
            <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6">
              <label className="flex flex-col items-center cursor-pointer">
                {!imagePreview ? (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">点击上传图片</span>
                  </>
                ) : (
                  <img src={imagePreview} alt="Preview" className="max-h-64 rounded" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            
            <div className="flex justify-between gap-4 sticky bottom-0 pt-2 bg-white">
              <Button variant="outline" onClick={handleClear} className="w-1/3">
                清除
              </Button>
              <Button 
                onClick={handleCorrection} 
                className="w-2/3" 
                disabled={!selectedImage || !selectedStudent || loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                添加到批改队列
              </Button>
            </div>
            
            {correctionQueue.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-medium mb-3">批改队列 ({correctionQueue.length})</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {correctionQueue.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.status === 'processing' ? 'bg-blue-50 border-blue-200' : 
                        item.status === 'completed' ? 'bg-green-50 border-green-200' : 
                        item.status === 'failed' ? 'bg-red-50 border-red-200' : 
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 mr-3 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imagePreview} 
                            alt={`${item.student}的作文`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{item.student}</div>
                          <div className="text-xs text-gray-500">
                            {item.class === 'class18' ? '18班' : '19班'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {item.status === 'pending' && (
                          <span className="text-sm text-gray-500 mr-2">等待中</span>
                        )}
                        {item.status === 'processing' && (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-1 text-blue-500" />
                            <span className="text-sm text-blue-600">批改中</span>
                          </div>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-sm text-green-600 mr-2">已完成</span>
                        )}
                        {item.status === 'failed' && (
                          <span className="text-sm text-red-600 mr-2" title={item.error}>
                            失败
                          </span>
                        )}
                        
                        {item.status !== 'processing' && (
                          <button
                            onClick={() => removeFromQueue(item.id)}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setCorrectionQueue([])}
                    disabled={isProcessingQueue}
                  >
                    清空队列
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setActiveTab('results')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    查看结果
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card className="p-5 shadow-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">批改结果</h2>
              {history.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllHistory}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  清除全部
                </Button>
              )}
            </div>
            
            {history.length > 0 ? (
              <div className="results-container">
                {/* 左侧列表 */}
                <div className="results-sidebar">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className={`result-list-item ${selectedResultId === item.id ? 'active' : ''}`}
                      onClick={() => toggleResult(item.id)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt="作文图片"
                            className="thumbnail-image"
                            onClick={(e) => openImagePreview(item.imageUrl, e)}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="font-medium truncate flex items-center">
                            <span className="truncate">{item.name}</span>
                            <span className="ml-2 text-xs shrink-0 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                              {item.score}分
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mb-1">
                            {item.class === 'class18' ? '18班' : '19班'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.date}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-1 h-9 w-9 p-1 flex-shrink-0 opacity-70 hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 右侧内容 */}
                <div className="results-content">
                  {selectedResultId ? (
                    (() => {
                      const selectedItem = history.find(item => item.id === selectedResultId);
                      return selectedItem ? (
                        <div dangerouslySetInnerHTML={renderMarkdown(selectedItem.result)} />
                      ) : <div className="p-4 text-center text-gray-500">选择一条记录查看详情</div>
                    })()
                  ) : (
                    <div className="p-4 text-center text-gray-500">选择一条记录查看详情</div>
                  )}
                </div>
              </div>
            ) : (
              <Alert className="shadow-sm">
                <AlertTitle>无批改记录</AlertTitle>
                <AlertDescription>
                  请先上传作文图片并进行批改
                </AlertDescription>
              </Alert>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="students">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">学生名单设置</h2>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={selectedClass === 'class18' ? "default" : "outline"}
                  onClick={() => handleClassChange('class18')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  18班
                </Button>
                <Button
                  size="sm"
                  variant={selectedClass === 'class19' ? "default" : "outline"}
                  onClick={() => handleClassChange('class19')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  19班
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500 mb-2">
                正在编辑: <span className="font-medium">{selectedClass === 'class18' ? '18班' : '19班'}</span> 学生名单
              </p>
              <Button onClick={saveStudentList} size="sm">
                <Save className="h-4 w-4 mr-1" />
                保存名单
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">
              每行输入一个学生姓名，保存后可在上传页面选择
            </p>
            
            <Textarea 
              placeholder="例如:&#10;张三&#10;李四&#10;王五" 
              value={selectedClass === 'class18' ? class18List : class19List}
              onChange={(e) => selectedClass === 'class18' 
                ? setClass18List(e.target.value) 
                : setClass19List(e.target.value)
              }
              className="min-h-[500px]"
            />
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-4">系统设置</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" htmlFor="apiKey">
                    SiliconFlow API密钥
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="apiKey"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="输入SiliconFlow API密钥"
                      className="flex-grow"
                    />
                    <Button onClick={handleSaveApiKey} disabled={loading}>
                      保存
                    </Button>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      请在<a href="https://siliconflow.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">SiliconFlow网站</a>注册并创建API密钥
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={testApiConnection}
                      disabled={loading || !apiKey}
                      className="ml-2"
                    >
                      {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      测试连接
                    </Button>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTitle className="text-blue-800">关于API密钥</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    API密钥用于连接SiliconFlow服务，访问deepseek-ai/DeepSeek-R1模型进行作文批改。密钥仅保存在您的浏览器中，不会发送至其他服务器。
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6 border-t pt-6">
                  <h3 className="font-medium text-lg mb-4">数据同步设置</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    通过GitHub Gist服务在多台设备间同步您的设置和批改结果。
                    {syncEnabled && <span className="ml-2 text-green-600 font-medium">✓ 已启用</span>}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="gistToken">
                        GitHub Token
                      </label>
                      <Input
                        id="gistToken"
                        type="password"
                        value={gistToken}
                        onChange={(e) => setGistToken(e.target.value)}
                        placeholder="输入GitHub个人访问令牌"
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">创建GitHub令牌</a>
                        （需要gist权限）
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2" htmlFor="gistId">
                        Gist ID
                      </label>
                      <Input
                        id="gistId"
                        value={gistId}
                        onChange={(e) => setGistId(e.target.value)}
                        placeholder="输入您创建的Gist ID"
                        className="w-full"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        <a href="https://gist.github.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">创建新的Gist</a>
                        并复制网址中的ID部分
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      {syncEnabled ? (
                        <>
                          <Button 
                            onClick={manualSync} 
                            disabled={syncLoading}
                            className="flex-1"
                          >
                            {syncLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            立即同步
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={disableSync}
                            className="flex-1"
                          >
                            禁用同步
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={saveGistConfig}
                          className="w-full"
                          disabled={!gistToken || !gistId || syncLoading}
                        >
                          {syncLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          启用数据同步
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <Alert className="bg-yellow-50 border-yellow-200 mb-2">
                  <AlertTitle className="text-yellow-800">如何设置数据同步</AlertTitle>
                  <AlertDescription className="text-yellow-700 text-sm">
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>访问 <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">GitHub</a> 创建个人访问令牌（勾选gist权限）</li>
                      <li>访问 <a href="https://gist.github.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Gist</a> 创建一个新的私密Gist</li>
                      <li>从Gist的网址中复制ID（如 https://gist.github.com/username/<b>abcd1234</b>）</li>
                      <li>填入上方表单并启用同步</li>
                    </ol>
                  </AlertDescription>
                </Alert>
                
                <div className="mt-8">
                  <h3 className="font-medium mb-2">系统信息</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                    <p>版本: 1.0.0</p>
                    <p>最近更新: 2024年4月</p>
                    <p>© 2024 Luna Writing Grader. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <style jsx global>{`
        .correction-content {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }
        
        .correction-wrapper {
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        /* 主标题样式 - 对应"修改建议"和"优化建议" */
        .main-title {
          font-size: 22px;
          font-weight: 700;
          color: #1a56db;
          margin-top: 16px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3b82f6;
          max-width: 200px;
        }
        
        /* 子标题样式 - 对应"1. 高级语法错误" */
        .sub-title {
          font-size: 18px;
          font-weight: 600;
          color: #4b5563;
          margin-top: 16px;
          margin-bottom: 10px;
          padding-left: 14px;
          border-left: 4px solid #3b82f6;
        }
        
        /* 正文文本区域 */
        .content-text {
          font-size: 16px;
          line-height: 1.8;
          color: #374151;
          margin-bottom: 16px;
          padding-left: 18px;
          text-align: justify;
        }
        
        /* 引用文本 */
        .quote {
          color: #047857;
          font-style: italic;
          background-color: rgba(209, 250, 229, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        /* 英文高亮 */
        .english-highlight {
          color: #7c3aed;
          font-weight: 500;
          padding: 0 2px;
        }

        /* 通用强调 */
        .correction-content strong {
          color: #4b5563;
          font-weight: 600;
        }
        
        /* 项目容器 */
        .item-container {
          margin-bottom: 20px;
          padding: 12px 14px 14px 12px;
          border-radius: 10px;
          background-color: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.2s ease;
        }
        
        .item-container:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }
        
        /* 第一个标题特殊处理 */
        .correction-wrapper > .main-title:first-child {
          margin-top: 0;
        }
        
        /* 批改结果左侧列表项样式 */
        .result-list-item {
          padding: 10px 14px;
          margin-bottom: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          cursor: pointer;
        }
        
        .result-list-item:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .result-list-item.active {
          background-color: #eff6ff;
          border-left-color: #3b82f6;
          box-shadow: 0 2px 5px rgba(59, 130, 246, 0.1);
        }
        
        /* 批改结果布局 */
        .results-container {
          display: flex;
          height: 650px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .results-sidebar {
          width: 30%;
          border-right: 1px solid #e5e7eb;
          overflow-y: auto;
          background-color: #f9fafb;
        }
        
        .results-content {
          width: 70%;
          overflow-y: auto;
          padding: 20px;
          background-color: white;
        }
        
        /* 缩略图样式 */
        .thumbnail-image {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;
          cursor: pointer;
        }
        
        .thumbnail-image:hover {
          transform: scale(1.05);
          box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
};

export default EssayCorrection; 