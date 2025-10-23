import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Check, X, Loader2, Sun, Moon, Copy, FileText,
  Bold, Italic, Underline, Link, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, IndentDecrease, IndentIncrease,
  Palette, MoveVertical
} from 'lucide-react';

const TextEditor = () => {
  const [text, setText] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, isBelow: false });
  const editorRef = useRef(null);

  const categories = [
    { id: 'all', label: 'All', color: 'bg-purple-500' },
    { id: 'grammar', label: 'Grammar', color: 'bg-blue-500' },
    { id: 'spelling', label: 'Spelling', color: 'bg-red-500' },
    { id: 'punctuation', label: 'Punctuation', color: 'bg-yellow-500' },
    { id: 'style', label: 'Style', color: 'bg-green-500' },
    { id: 'clarity', label: 'Clarity', color: 'bg-indigo-500' }
  ];

  const sampleTexts = [
    'Human welfare is at the heart of our work at Anthropic: our mission is to make sure that increasingly capable and sophisticated AI systems remain beneficial to humanity.\n\nBut as we build those AI systems, and as they begin to approximate or surpass many human qualities, another question arises. Should we also be concerned about the potential consciousness and experiences of the models themselves? Should we be concerned about *model welfare*, too?\n\nThis is an open question, and one that\'s both philosophically and scientifically difficult. But now that models can communicate, relate, plan, problem-solve, and pursue goals—along with very many more characteristics we associate with people—we think it\'s time to address it.\n\nTo that end, we recently started a research program to investigate, and prepare to navigate, model welfare.'
  ];

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000'
  ];

  const fonts = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Comic Sans MS', label: 'Comic Sans MS' }
  ];

  const textSizes = [
    { value: '13.33px', label: '10' },
    { value: '14.67px', label: '11' },
    { value: '16px', label: '12' },
    { value: '18.67px', label: '14' },
    { value: '21.33px', label: '16' },
    { value: '24px', label: '18' },
    { value: '32px', label: '24' },
    { value: '48px', label: '36' }
  ];

  const lineSpacings = [
    { value: '1', label: '1.0' },
    { value: '1.15', label: '1.15' },
    { value: '1.5', label: '1.5' },
    { value: '2', label: '2.0' }
  ];

  // Execute formatting command with improved list handling
  const formatText = (command, value = null) => {
    editorRef.current.focus();
    
    if (command === 'fontSize') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      
      if (range.collapsed) {
        const allContent = editorRef.current.childNodes;
        allContent.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            const span = document.createElement('span');
            span.style.fontSize = value;
            span.style.fontFamily = 'Arial';
            span.textContent = node.textContent;
            node.parentNode.replaceChild(span, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            node.style.fontSize = value;
          }
        });
      } else {
        try {
          const contents = range.extractContents();
          const span = document.createElement('span');
          span.style.fontSize = value;
          while (contents.firstChild) {
            span.appendChild(contents.firstChild);
          }
          range.insertNode(span);
          range.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          document.execCommand('fontSize', false, '7');
          const tempFonts = editorRef.current.querySelectorAll('font[size="7"]');
          tempFonts.forEach(font => {
            const span = document.createElement('span');
            span.style.fontSize = value;
            span.innerHTML = font.innerHTML;
            font.parentNode.replaceChild(span, font);
          });
        }
      }
    } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
      // Improved list handling
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if we're already in a list
        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        
        const inList = node.closest('ul, ol');
        
        if (inList) {
          // Toggle off the list
          document.execCommand(command, false, null);
        } else {
          // Make sure we have a proper block element
          const block = node.closest('div, p');
          if (!block || block === editorRef.current) {
            document.execCommand('formatBlock', false, 'div');
          }
          
          // Now apply the list
          setTimeout(() => {
            document.execCommand(command, false, null);
            editorRef.current.focus();
          }, 10);
        }
      }
    } else if (command === 'indent' || command === 'outdent') {
      // Handle indent/outdent
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentNode;
        }
        
        // Check if we're in a list
        const listItem = node.closest('li');
        if (listItem) {
          document.execCommand(command, false, null);
        } else {
          // For non-list content, use margin
          const block = node.closest('div, p') || node;
          if (block && block !== editorRef.current) {
            const currentMargin = parseInt(block.style.marginLeft || 0);
            if (command === 'indent') {
              block.style.marginLeft = `${currentMargin + 40}px`;
            } else if (currentMargin > 0) {
              block.style.marginLeft = `${Math.max(0, currentMargin - 40)}px`;
            }
          }
        }
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    editorRef.current.focus();
    updateContent();
  };

  // Update content and extract plain text
  const updateContent = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlContent(html);
      
      // Close tooltip when editing
      setActiveTooltip(null);
      
      // Create a temporary element to extract text while preserving structure
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Remove only the mark tags but keep their content
      const marks = tempDiv.querySelectorAll('mark');
      marks.forEach(mark => {
        const textNode = document.createTextNode(mark.textContent);
        mark.parentNode.replaceChild(textNode, mark);
      });
      
      // Convert <br> tags to newlines for proper text extraction
      tempDiv.innerHTML = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, '\n');
      
      // Extract text content preserving quotes and special characters
      const plainText = tempDiv.textContent || '';
      setText(plainText);
    }
  };

  // Handle click on highlighted text
  const handleHighlightClick = (e, issueText) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the matching suggestion
    const matchingSuggestion = suggestions.find(s => s.issue === issueText);
    if (!matchingSuggestion) return;
    
    // Calculate tooltip position
    const rect = e.target.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    
    // Position tooltip above the highlighted text by default
    let top = rect.top - editorRect.top - 10; // 10px above
    let left = rect.left - editorRect.left + (rect.width / 2); // Center horizontally
    let isBelow = false;
    
    // Ensure tooltip doesn't go above the editor
    if (top < 100) { // If too close to top, show below instead
      top = rect.bottom - editorRect.top + 10;
      isBelow = true;
    }
    
    // Ensure tooltip doesn't go outside horizontally
    const tooltipWidth = 300; // approximate width
    if (left - tooltipWidth/2 < 10) {
      left = tooltipWidth/2 + 10;
    } else if (left + tooltipWidth/2 > editorRect.width - 10) {
      left = editorRect.width - tooltipWidth/2 - 10;
    }
    
    setTooltipPosition({ top, left, isBelow });
    setActiveTooltip(matchingSuggestion);
  };

  // Apply highlights to text based on suggestions
  const applyHighlights = () => {
    if (!editorRef.current) return;
    
    // Get the current HTML content
    let content = editorRef.current.innerHTML;
    
    // Remove existing highlights
    content = content.replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1');
    
    // If no suggestions, just update the content without highlights
    if (suggestions.length === 0) {
      editorRef.current.innerHTML = content;
      return;
    }
    
    // Apply new highlights for each suggestion
    suggestions.forEach(suggestion => {
      const categoryColors = {
        grammar: 'rgba(59, 130, 246, 0.3)', // blue
        spelling: 'rgba(239, 68, 68, 0.3)', // red
        punctuation: 'rgba(245, 158, 11, 0.3)', // yellow
        style: 'rgba(34, 197, 94, 0.3)', // green
        clarity: 'rgba(99, 102, 241, 0.3)' // indigo
      };
      
      const color = categoryColors[suggestion.category] || 'rgba(147, 51, 234, 0.3)';
      
      // Escape special characters for HTML content matching
      const escapeHtml = (text) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };
      
      // Try to find and highlight the issue text
      const issueText = suggestion.issue;
      const escapedIssue = escapeHtml(issueText);
      
      // Try multiple matching strategies
      const patterns = [
        issueText, // Original text
        escapedIssue, // HTML-escaped version
        issueText.replace(/"/g, '&quot;').replace(/'/g, '&#039;'), // Only escape quotes
        issueText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Regex escaped
      ];
      
      let highlighted = false;
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          content = content.replace(
            pattern,
            `<mark data-issue="${encodeURIComponent(issueText)}" style="background-color: ${color}; padding: 2px 0; border-radius: 2px; cursor: pointer; transition: filter 0.2s;" onmouseover="this.style.filter='brightness(0.85)'" onmouseout="this.style.filter='brightness(1)'">${pattern}</mark>`
          );
          highlighted = true;
          break;
        }
      }
      
      // If not found, try a more flexible approach
      if (!highlighted) {
        console.log(`Could not highlight: "${issueText}" in category ${suggestion.category}`);
      }
    });
    
    // Update the editor content
    editorRef.current.innerHTML = content;
  };

  // Initialize editor on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = '<div><br></div>';
    }
  }, []);

  // Update highlights when suggestions change
  useEffect(() => {
    applyHighlights();
  }, [suggestions]);

  // Update highlights when suggestions change
  useEffect(() => {
    applyHighlights();
  }, [suggestions]);

  // Add click handler for highlights
  useEffect(() => {
    if (!editorRef.current) return;
    
    const handleEditorClick = (e) => {
      if (e.target.tagName === 'MARK') {
        const issueText = decodeURIComponent(e.target.getAttribute('data-issue') || '');
        handleHighlightClick(e, issueText);
      }
    };
    
    editorRef.current.addEventListener('click', handleEditorClick);
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleEditorClick);
      }
    };
  }, [suggestions]);

  // Close dropdowns and tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isColorPicker = e.target.closest('[data-dropdown="color"]');
      const isLineSpacing = e.target.closest('[data-dropdown="line-spacing"]');
      const isTooltip = e.target.closest('[data-tooltip]');
      const isHighlight = e.target.tagName === 'MARK';
      
      if (!isColorPicker) {
        setShowColorPicker(false);
      }
      if (!isLineSpacing) {
        setShowLineSpacing(false);
      }
      if (!isTooltip && !isHighlight) {
        setActiveTooltip(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle paste events to clean formatting
  const handlePaste = (e) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    
    // Split by double line breaks to identify paragraphs
    const paragraphs = text.split(/\n\n+/);
    const cleanHTML = paragraphs
      .map(paragraph => {
        // Within each paragraph, convert single line breaks to <br>
        const lines = paragraph.split('\n');
        const paragraphHTML = lines
          .map(line => line.trim())
          .filter(line => line)
          .join('<br>');
        
        if (paragraphHTML) {
          return `<div style="font-family: Arial; font-size: 16px;">${paragraphHTML}</div>`;
        }
        return '';
      })
      .filter(html => html)
      .join('<div><br></div>'); // Empty div between paragraphs for spacing
    
    // Insert the cleaned HTML
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    selection.deleteFromDocument();
    const range = selection.getRangeAt(0);
    const fragment = range.createContextualFragment(cleanHTML);
    range.insertNode(fragment);
    
    // Move cursor to end of inserted content
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    updateContent();
  };

  // Handle copy events to remove highlights
  const handleCopy = (e) => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const clonedSelection = range.cloneContents();
    
    // Create a temporary div to clean the content
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(clonedSelection);
    
    // Remove all mark tags but keep their content
    const marks = tempDiv.querySelectorAll('mark');
    marks.forEach(mark => {
      const span = document.createElement('span');
      span.innerHTML = mark.innerHTML;
      // Copy any font styling from the mark's parent or use defaults
      const parent = mark.parentElement;
      if (parent && parent.style.fontSize) {
        span.style.fontSize = parent.style.fontSize;
      }
      if (parent && parent.style.fontFamily) {
        span.style.fontFamily = parent.style.fontFamily;
      }
      mark.parentNode.replaceChild(span, mark);
    });
    
    // Remove background styles from all elements
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style) {
        el.style.backgroundColor = '';
        el.style.background = '';
        el.style.backgroundImage = '';
        el.style.backgroundClip = '';
        // Remove any webkit background clip that might affect text
        el.style.webkitBackgroundClip = '';
        el.style.webkitTextFillColor = '';
      }
    });
    
    // Set both plain text and HTML data
    e.clipboardData.setData('text/plain', tempDiv.textContent);
    e.clipboardData.setData('text/html', tempDiv.innerHTML);
    e.preventDefault();
  };

  // Handle link insertion
  const insertLink = () => {
    if (linkUrl) {
      formatText('createLink', linkUrl);
      setShowLinkDialog(false);
      setLinkUrl('');
    }
  };

  const loadSampleText = () => {
    const randomSample = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    if (editorRef.current) {
      // Convert newlines to properly formatted HTML with spacing between paragraphs
      const paragraphs = randomSample.split('\n\n').map(p => p.trim()).filter(p => p);
      const htmlContent = paragraphs
        .map(p => `<div style="font-family: Arial; font-size: 16px;">${p}</div>`)
        .join('<div><br></div>'); // Add empty div between paragraphs for spacing
      
      editorRef.current.innerHTML = htmlContent;
      
      // Add an empty div at the end for better cursor positioning
      const lastDiv = document.createElement('div');
      lastDiv.innerHTML = '<br>';
      editorRef.current.appendChild(lastDiv);
      
      updateContent();
    }
  };

  const analyzeText = async () => {
    // Clear any existing highlights before analyzing
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      content = content.replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1');
      editorRef.current.innerHTML = content;
      updateContent();
    }
    
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSuggestions([]);

    try {
      // Make sure we're sending the exact text including quotes
      const textToAnalyze = text;
      
      const prompt = `Analyze the following text and provide specific suggestions for improvement. Focus on grammar, spelling, punctuation, style, and clarity. 

Text to analyze:
"${textToAnalyze}"

IMPORTANT: When identifying issues, preserve the EXACT text including all quotation marks, apostrophes, and special characters. For example, if the text contains "consumers" with quotes, the issue field should be "consumers" not consumers.

Respond with a JSON array of suggestion objects. Each object should have:
- category: one of "grammar", "spelling", "punctuation", "style", or "clarity"
- issue: the EXACT text that needs improvement (including any quotes or special characters)
- suggestion: the corrected or improved version
- explanation: a brief explanation of why this change improves the text
- position: approximate starting position in the text (character index)

Only include actual issues that need correction. If the text is perfect, return an empty array.

Your entire response must be a valid JSON array. DO NOT include any text outside the JSON structure.`;

      const response = await window.claude.complete(prompt);
      
      try {
        const parsedSuggestions = JSON.parse(response);
        if (Array.isArray(parsedSuggestions)) {
          setSuggestions(parsedSuggestions);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setError('Failed to parse suggestions. Please try again.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (!editorRef.current) return;
    
    // Get the current content without highlights
    let content = editorRef.current.innerHTML;
    content = content.replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1');
    
    // Try to find and replace the suggestion
    const issueText = suggestion.issue;
    const replacementText = suggestion.suggestion;
    
    // Escape special characters for HTML
    const escapeHtml = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    // Try multiple replacement strategies
    const patterns = [
      issueText, // Original text
      escapeHtml(issueText), // HTML-escaped version
      issueText.replace(/"/g, '&quot;').replace(/'/g, '&#039;') // Only escape quotes
    ];
    
    let replaced = false;
    for (const pattern of patterns) {
      if (content.includes(pattern)) {
        content = content.replace(pattern, escapeHtml(replacementText));
        replaced = true;
        break;
      }
    }
    
    if (!replaced) {
      console.log(`Could not find text to replace: "${issueText}"`);
    }
    
    // Update the editor
    editorRef.current.innerHTML = content;
    updateContent();
    
    // Remove the applied suggestion
    setSuggestions(suggestions.filter(s => s !== suggestion));
    
    // Close tooltip if it was showing this suggestion
    if (activeTooltip && activeTooltip.issue === suggestion.issue) {
      setActiveTooltip(null);
    }
  };

  const filteredSuggestions = activeCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeCategory);

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.id === category);
    return cat ? cat.color : 'bg-gray-500';
  };

  const copyText = () => {
    // Create a temporary element with the cleaned content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current.innerHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(tempDiv);
    
    // Remove all mark tags (highlights) but keep their content with proper styling
    const marks = tempDiv.querySelectorAll('mark');
    marks.forEach(mark => {
      const span = document.createElement('span');
      span.innerHTML = mark.innerHTML;
      // Preserve font styling
      const parent = mark.parentElement;
      if (parent && parent.style.fontSize) {
        span.style.fontSize = parent.style.fontSize;
      }
      if (parent && parent.style.fontFamily) {
        span.style.fontFamily = parent.style.fontFamily;
      }
      mark.parentNode.replaceChild(span, mark);
    });
    
    // Remove any background styles
    const allElements = tempDiv.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.style) {
        el.style.backgroundColor = '';
        el.style.background = '';
        el.style.backgroundImage = '';
        el.style.backgroundClip = '';
        el.style.webkitBackgroundClip = '';
        el.style.webkitTextFillColor = '';
      }
    });
    
    // Select and copy the cleaned content
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      document.execCommand('copy');
      selection.removeAllRanges();
      document.body.removeChild(tempDiv);
    } catch (err) {
      document.body.removeChild(tempDiv);
      // Fallback to plain text copy
      navigator.clipboard.writeText(text);
    }
  };

  // Dismiss a suggestion
  const dismissSuggestion = (suggestion) => {
    setSuggestions(suggestions.filter(s => s !== suggestion));
    if (activeTooltip && activeTooltip.issue === suggestion.issue) {
      setActiveTooltip(null);
    }
  };

  // Toolbar button component
  const ToolbarButton = ({ icon: Icon, onClick, onMouseDown, title, active = false }) => (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={title}
      className={`p-2 rounded transition-colors ${
        active 
          ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
          : isDarkMode 
            ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
            : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const ToolbarSeparator = () => (
    <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Claude Writing Assistant
            </h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className={`rounded-xl shadow-lg p-6 relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your Text
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={loadSampleText}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Sample
                </button>
                <button
                  onClick={copyText}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className={`flex flex-wrap items-center gap-1 p-2 mb-2 rounded-lg border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-300'
            }`}>
              {/* Font Selection */}
              <select
                onChange={(e) => formatText('fontName', e.target.value)}
                defaultValue="Arial"
                className={`px-2 py-1 rounded text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                title="Font Family"
              >
                {fonts.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>

              {/* Text Size */}
              <select
                onChange={(e) => formatText('fontSize', e.target.value)}
                defaultValue="16px"
                className={`px-2 py-1 rounded text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 border-gray-600' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                title="Font Size"
              >
                {textSizes.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>

              <ToolbarSeparator />

              <ToolbarButton icon={Bold} onClick={() => formatText('bold')} title="Bold" />
              <ToolbarButton icon={Italic} onClick={() => formatText('italic')} title="Italic" />
              <ToolbarButton icon={Underline} onClick={() => formatText('underline')} title="Underline" />
              
              <ToolbarSeparator />
              
              <div className="relative" data-dropdown="color">
                <ToolbarButton 
                  icon={Palette} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColorPicker(!showColorPicker);
                  }} 
                  title="Text Color" 
                />
                {showColorPicker && (
                  <div className={`absolute top-10 left-0 p-2 rounded-lg shadow-lg z-10 ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="grid grid-cols-5 gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            formatText('foreColor', color);
                            setShowColorPicker(false);
                          }}
                          className="w-6 h-6 rounded border border-gray-400"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <ToolbarButton icon={Link} onClick={() => setShowLinkDialog(true)} title="Add Link" />
              
              <ToolbarSeparator />
              
              <ToolbarButton icon={AlignLeft} onClick={() => formatText('justifyLeft')} title="Align Left" />
              <ToolbarButton icon={AlignCenter} onClick={() => formatText('justifyCenter')} title="Align Center" />
              <ToolbarButton icon={AlignRight} onClick={() => formatText('justifyRight')} title="Align Right" />
              
              <ToolbarSeparator />
              
              <div className="relative" data-dropdown="line-spacing">
                <ToolbarButton 
                  icon={MoveVertical} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLineSpacing(!showLineSpacing);
                  }} 
                  title="Line Spacing" 
                />
                {showLineSpacing && (
                  <div className={`absolute top-10 left-0 p-2 rounded-lg shadow-lg z-10 ${
                    isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex flex-col gap-1">
                      {lineSpacings.map(spacing => (
                        <button
                          key={spacing.value}
                          onClick={() => {
                            editorRef.current.style.lineHeight = spacing.value;
                            setShowLineSpacing(false);
                          }}
                          className={`px-3 py-1 text-sm text-left rounded hover:bg-opacity-10 ${
                            isDarkMode ? 'hover:bg-white text-gray-300' : 'hover:bg-black text-gray-700'
                          }`}
                        >
                          {spacing.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <ToolbarSeparator />
              
              <ToolbarButton 
                icon={List} 
                onMouseDown={(e) => {
                  e.preventDefault();
                  formatText('insertUnorderedList');
                }} 
                title="Bullet List" 
              />
              <ToolbarButton 
                icon={ListOrdered} 
                onMouseDown={(e) => {
                  e.preventDefault();
                  formatText('insertOrderedList');
                }} 
                title="Numbered List" 
              />
              <ToolbarButton icon={IndentDecrease} onClick={() => formatText('outdent')} title="Decrease Indent" />
              <ToolbarButton icon={IndentIncrease} onClick={() => formatText('indent')} title="Increase Indent" />
            </div>

            {/* Link Dialog */}
            {showLinkDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Add Link
                  </h3>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Enter URL"
                    className={`w-64 px-3 py-2 rounded border ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={insertLink}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkDialog(false);
                        setLinkUrl('');
                      }}
                      className={`px-4 py-2 rounded ${
                        isDarkMode 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rich Text Editor with improved list styles */}
            <style 
              dangerouslySetInnerHTML={{ __html: `
              [contenteditable] {
                outline: none;
              }
              [contenteditable] ul,
              [contenteditable] ol {
                margin: 8px 0;
                padding-left: 24px;
                font-family: inherit;
                font-size: inherit;
              }
              [contenteditable] li {
                margin: 4px 0;
                font-family: inherit;
                font-size: inherit;
                list-style-position: outside;
              }
              [contenteditable] ul {
                list-style-type: disc;
              }
              [contenteditable] ol {
                list-style-type: decimal;
              }
              [contenteditable] ul ul {
                list-style-type: circle;
              }
              [contenteditable] ul ul ul {
                list-style-type: square;
              }
              [contenteditable]:empty:before {
                content: "";
                display: inline-block;
              }
              [contenteditable] div {
                font-family: inherit;
                font-size: inherit;
                margin: 0;
                padding: 0;
                min-height: 1.2em;
              }
              [contenteditable] li > div {
                display: inline;
              }
              ${isDarkMode ? `
                [contenteditable] li::marker {
                  color: #d1d5db;
                }
              ` : ''}
            `}} />
            <div
              ref={editorRef}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onInput={updateContent}
              onPaste={handlePaste}
              onCopy={handleCopy}
              className={`w-full h-96 p-4 rounded-lg border transition-colors overflow-y-auto focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700 text-white focus:ring-purple-500' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-400'
              }`}
              style={{ 
                minHeight: '24rem',
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
                lineHeight: '1.5',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
              }}
            />
            
            <div className="mt-4 flex justify-between items-center">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {text.length} characters
              </span>
              <button
                onClick={analyzeText}
                disabled={isAnalyzing || !text.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                  isAnalyzing || !text.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Text
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Suggestion Tooltip */}
            {activeTooltip && (
              <div
                data-tooltip
                className={`absolute z-20 p-3 rounded-lg shadow-xl border ${
                  isDarkMode 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  transform: tooltipPosition.isBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                  maxWidth: '300px'
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(activeTooltip.category)}`}>
                    {activeTooltip.category}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`line-through ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {activeTooltip.issue}
                    </span>
                    <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>→</span>
                    <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {activeTooltip.suggestion}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activeTooltip.explanation}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => applySuggestion(activeTooltip)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      dismissSuggestion(activeTooltip);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setActiveTooltip(null)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Tooltip arrow */}
                <div 
                  className={`absolute w-3 h-3 transform rotate-45 ${
                    isDarkMode ? 'bg-gray-900' : 'bg-white'
                  }`}
                  style={{
                    ...(tooltipPosition.isBelow ? {
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      borderLeft: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderTop: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                    } : {
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      borderRight: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                      borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`
                    })
                  }}
                />
              </div>
            )}
          </div>

          {/* Suggestions Panel */}
          <div className={`rounded-xl shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Suggestions
            </h2>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category.id
                      ? `${category.color} text-white`
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.label}
                  {suggestions.filter(s => category.id === 'all' || s.category === category.id).length > 0 && (
                    <span className="ml-1">
                      ({suggestions.filter(s => category.id === 'all' || s.category === category.id).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSuggestions.length === 0 ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {suggestions.length === 0 
                    ? "Click 'Analyze Text' to get suggestions"
                    : "No suggestions in this category"}
                </div>
              ) : (
                filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      isDarkMode 
                        ? 'bg-gray-900 border-gray-700 hover:border-gray-600' 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(suggestion.category)}`}>
                          {suggestion.category}
                        </span>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: {
                              grammar: 'rgba(59, 130, 246, 0.5)',
                              spelling: 'rgba(239, 68, 68, 0.5)',
                              punctuation: 'rgba(245, 158, 11, 0.5)',
                              style: 'rgba(34, 197, 94, 0.5)',
                              clarity: 'rgba(99, 102, 241, 0.5)'
                            }[suggestion.category] || 'rgba(147, 51, 234, 0.5)'
                          }}
                          title="Text highlight color"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => applySuggestion(suggestion)}
                          className="p-1 rounded hover:bg-green-500/20 text-green-500 transition-colors"
                          title="Apply suggestion"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => dismissSuggestion(suggestion)}
                          className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`line-through ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                          {suggestion.issue}
                        </span>
                        <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>→</span>
                        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {suggestion.suggestion}
                        </span>
                      </div>
                      
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {suggestion.explanation}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {suggestions.length > 0 && (
              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => {
                    if (!editorRef.current) return;
                    
                    // Get content without highlights
                    let content = editorRef.current.innerHTML;
                    content = content.replace(/<mark[^>]*>(.*?)<\/mark>/g, '$1');
                    
                    // Escape special characters for HTML
                    const escapeHtml = (text) => {
                      return text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                    };
                    
                    // Apply all suggestions
                    suggestions.forEach(suggestion => {
                      const issueText = suggestion.issue;
                      const replacementText = suggestion.suggestion;
                      
                      // Try multiple patterns
                      const patterns = [
                        issueText,
                        escapeHtml(issueText),
                        issueText.replace(/"/g, '&quot;').replace(/'/g, '&#039;')
                      ];
                      
                      for (const pattern of patterns) {
                        if (content.includes(pattern)) {
                          content = content.replace(pattern, escapeHtml(replacementText));
                          break;
                        }
                      }
                    });
                    
                    // Update editor
                    editorRef.current.innerHTML = content;
                    updateContent();
                    
                    // Clear all suggestions
                    setSuggestions([]);
                  }}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  Apply All Suggestions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
