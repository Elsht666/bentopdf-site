import './utils/map-upsert-polyfill.js';
import './utils/setup-pdf-worker.js';
import { categories } from './config/tools.js';
import { dom, switchView, hideAlert } from './ui.js';
import { ShortcutsManager } from './logic/shortcuts.js';
import { createIcons, icons } from 'lucide';
import '@phosphor-icons/web/regular';
import * as pdfjsLib from 'pdfjs-dist';
import '../css/styles.css';
import {
  escapeHtml,
  formatShortcutDisplay,
} from './utils/helpers.js';
import {
  initI18n,
  applyTranslations,
  rewriteLinks,
  injectLanguageSwitcher,
  t,
} from './i18n/index.js';
import {
  loadRuntimeConfig,
  isToolDisabled,
  isCurrentPageDisabled,
} from './utils/disabled-tools.js';
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from './utils/safe-storage.js';
declare const __BRAND_NAME__: string;

const init = async () => {
  await initI18n();
  await loadRuntimeConfig();
  injectLanguageSwitcher();
  applyTranslations();

  if (isCurrentPageDisabled()) {
    document.title = t('disabledTool.title') || 'Tool Unavailable';
    const main = document.querySelector('main') || document.body;
    const heading = t('disabledTool.heading') || 'This tool has been disabled';
    const message =
      t('disabledTool.message') ||
      'This tool is not available in your deployment. Contact your administrator for more information.';
    const backHome = t('disabledTool.backHome') || 'Back to Home';
    main.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <i class="ph ph-prohibit text-6xl text-gray-500 mb-4"></i>
        <h1 class="text-2xl font-bold text-white mb-2">${heading}</h1>
        <p class="text-gray-400 mb-6">${message}</p>
        <a href="${import.meta.env.BASE_URL}" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">${backHome}</a>
      </div>
    `;
    return;
  }

  if (__SIMPLE_MODE__) {
    const hideBrandingSections = () => {
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        heroSection.style.display = 'none';
      }

      const featuresSection = document.getElementById('features-section');
      if (featuresSection) {
        featuresSection.style.display = 'none';
      }

      const securitySection = document.getElementById(
        'security-compliance-section'
      );
      if (securitySection) {
        securitySection.style.display = 'none';
      }

      const faqSection = document.getElementById('faq-accordion');
      if (faqSection) {
        faqSection.style.display = 'none';
      }

      const testimonialsSection = document.getElementById(
        'testimonials-section'
      );
      if (testimonialsSection) {
        testimonialsSection.style.display = 'none';
      }

      const supportSection = document.getElementById('support-section');
      if (supportSection) {
        supportSection.style.display = 'none';
      }

      // Hide "Used by companies" section
      const usedBySection = document.querySelector(
        '.hide-section'
      ) as HTMLElement;
      if (usedBySection) {
        usedBySection.style.display = 'none';
      }

      const sectionDividers = document.querySelectorAll('.section-divider');
      sectionDividers.forEach((divider) => {
        (divider as HTMLElement).style.display = 'none';
      });

      const brandName = __BRAND_NAME__ || 'BentoPDF';
      document.title = `${brandName} - ${t('simpleMode.title')}`;

      const toolsHeader = document.getElementById('tools-header');
      if (toolsHeader) {
        const title = toolsHeader.querySelector('h2');
        const subtitle = toolsHeader.querySelector('p');
        if (title) {
          title.textContent = t('simpleMode.title');
          title.className = 'text-4xl md:text-5xl font-bold text-white mb-3';
        }
        if (subtitle) {
          subtitle.textContent = t('simpleMode.subtitle');
          subtitle.className = 'text-lg text-gray-400';
        }
      }

      const app = document.getElementById('app');
      if (app) {
        app.style.paddingTop = '1rem';
      }
    };

    hideBrandingSections();
  }

  // Hide shortcuts buttons on mobile devices (Android/iOS)
  // exclude iPad -> users can connect keyboard and use shortcuts
  const isMobile = /Android|iPhone|iPod/i.test(navigator.userAgent);
  const keyboardShortcutBtn = document.getElementById('shortcut');
  const shortcutSettingsBtn = document.getElementById('open-shortcuts-btn');

  if (isMobile) {
    if (keyboardShortcutBtn) keyboardShortcutBtn.style.display = 'none';
    if (shortcutSettingsBtn) shortcutSettingsBtn.style.display = 'none';
  } else {
    if (keyboardShortcutBtn) {
      keyboardShortcutBtn.textContent = navigator.userAgent
        .toUpperCase()
        .includes('MAC')
        ? '⌘ + K'
        : 'Ctrl + K';
    }
  }

  const categoryTranslationKeys: Record<string, string> = {
    'Popular Tools': 'tools:categories.popularTools',
    'Edit & Annotate': 'tools:categories.editAnnotate',
    'Convert to PDF': 'tools:categories.convertToPdf',
    'Convert from PDF': 'tools:categories.convertFromPdf',
    'Organize & Manage': 'tools:categories.organizeManage',
    'Optimize & Repair': 'tools:categories.optimizeRepair',
    'Secure PDF': 'tools:categories.securePdf',
  };

  const toolTranslationKeys: Record<string, string> = {
    'PDF Workflow Builder': 'tools:pdfWorkflow',
    'PDF Multi Tool': 'tools:pdfMultiTool',
    'Merge PDF': 'tools:mergePdf',
    'Split PDF': 'tools:splitPdf',
    'Compress PDF': 'tools:compressPdf',
    'PDF Editor': 'tools:pdfEditor',
    'Edit PDF Text': 'tools:editPdfText',
    'JPG to PDF': 'tools:jpgToPdf',
    'Sign PDF': 'tools:signPdf',
    'Crop PDF': 'tools:cropPdf',
    'Extract Pages': 'tools:extractPages',
    'Duplicate & Organize': 'tools:duplicateOrganize',
    'Delete Pages': 'tools:deletePages',
    'Edit Bookmarks': 'tools:editBookmarks',
    'Table of Contents': 'tools:tableOfContents',
    'Page Numbers': 'tools:pageNumbers',
    'Add Page Labels': 'tools:addPageLabels',
    'Add Watermark': 'tools:addWatermark',
    'Header & Footer': 'tools:headerFooter',
    'Invert Colors': 'tools:invertColors',
    'Background Color': 'tools:backgroundColor',
    'Change Text Color': 'tools:changeTextColor',
    'Add Stamps': 'tools:addStamps',
    'Bates Numbering': 'tools:batesNumbering',
    'Remove Annotations': 'tools:removeAnnotations',
    'PDF Form Filler': 'tools:pdfFormFiller',
    'Create PDF Form': 'tools:createPdfForm',
    'Remove Blank Pages': 'tools:removeBlankPages',
    'Images to PDF': 'tools:imageToPdf',
    'PNG to PDF': 'tools:pngToPdf',
    'WebP to PDF': 'tools:webpToPdf',
    'SVG to PDF': 'tools:svgToPdf',
    'BMP to PDF': 'tools:bmpToPdf',
    'HEIC to PDF': 'tools:heicToPdf',
    'TIFF to PDF': 'tools:tiffToPdf',
    'Text to PDF': 'tools:textToPdf',
    'JSON to PDF': 'tools:jsonToPdf',
    'PDF to JPG': 'tools:pdfToJpg',
    'PDF to PNG': 'tools:pdfToPng',
    'PDF to WebP': 'tools:pdfToWebp',
    'PDF to BMP': 'tools:pdfToBmp',
    'PDF to TIFF': 'tools:pdfToTiff',
    'PDF to CBZ': 'tools:pdfToCbz',
    'PDF to Greyscale': 'tools:pdfToGreyscale',
    'PDF to JSON': 'tools:pdfToJson',
    'OCR PDF': 'tools:ocrPdf',
    'Alternate & Mix Pages': 'tools:alternateMerge',
    'Duplex Collate': 'tools:duplexCollate',
    'PDF Overlay': 'tools:pdfOverlay',
    'Organize & Duplicate': 'tools:duplicateOrganize',
    'Add Attachments': 'tools:addAttachments',
    'Extract Attachments': 'tools:extractAttachments',
    'Edit Attachments': 'tools:editAttachments',
    'Divide Pages': 'tools:dividePages',
    'Add Blank Page': 'tools:addBlankPage',
    'Reverse Pages': 'tools:reversePages',
    'Rotate PDF': 'tools:rotatePdf',
    'Rotate by Custom Degrees': 'tools:rotateCustom',
    'N-Up PDF': 'tools:nUpPdf',
    'Combine to Single Page': 'tools:combineToSinglePage',
    'View Metadata': 'tools:viewMetadata',
    'Edit Metadata': 'tools:editMetadata',
    'PDFs to ZIP': 'tools:pdfsToZip',
    'Compare PDFs': 'tools:comparePdfs',
    'Posterize PDF': 'tools:posterizePdf',
    'Fix Page Size': 'tools:fixPageSize',
    'Linearize PDF': 'tools:linearizePdf',
    'Page Dimensions': 'tools:pageDimensions',
    'Remove Restrictions': 'tools:removeRestrictions',
    'Repair PDF': 'tools:repairPdf',
    'Encrypt PDF': 'tools:encryptPdf',
    'Sanitize PDF': 'tools:sanitizePdf',
    'Decrypt PDF': 'tools:decryptPdf',
    'Flatten PDF': 'tools:flattenPdf',
    'Remove Metadata': 'tools:removeMetadata',
    'Change Permissions': 'tools:changePermissions',
    'Email to PDF': 'tools:emailToPdf',
    'Font to Outline': 'tools:fontToOutline',
    'Deskew PDF': 'tools:deskewPdf',
    'Digital Signature': 'tools:digitalSignPdf',
    'Validate Signature': 'tools:validateSignaturePdf',
    'Timestamp PDF': 'tools:timestampPdf',
    'Scanner Effect': 'tools:scannerEffect',
    'Adjust Colors': 'tools:adjustColors',
    'Markdown to PDF': 'tools:markdownToPdf',
    'PDF Booklet': 'tools:pdfBooklet',
    'Word to PDF': 'tools:wordToPdf',
    'Excel to PDF': 'tools:excelToPdf',
    'PowerPoint to PDF': 'tools:powerpointToPdf',
    'XPS to PDF': 'tools:xpsToPdf',
    'MOBI to PDF': 'tools:mobiToPdf',
    'EPUB to PDF': 'tools:epubToPdf',
    'FB2 to PDF': 'tools:fb2ToPdf',
    'CBZ to PDF': 'tools:cbzToPdf',
    'WPD to PDF': 'tools:wpdToPdf',
    'WPS to PDF': 'tools:wpsToPdf',
    'XML to PDF': 'tools:xmlToPdf',
    'Pages to PDF': 'tools:pagesToPdf',
    'ODG to PDF': 'tools:odgToPdf',
    'ODS to PDF': 'tools:odsToPdf',
    'ODP to PDF': 'tools:odpToPdf',
    'PUB to PDF': 'tools:pubToPdf',
    'VSD to PDF': 'tools:vsdToPdf',
    'PSD to PDF': 'tools:psdToPdf',
    'ODT to PDF': 'tools:odtToPdf',
    'CSV to PDF': 'tools:csvToPdf',
    'RTF to PDF': 'tools:rtfToPdf',
    'PDF to SVG': 'tools:pdfToSvg',
    'PDF to CSV': 'tools:pdfToCsv',
    'PDF to Excel': 'tools:pdfToExcel',
    'PDF to Text': 'tools:pdfToText',
    'Extract Tables': 'tools:extractTables',
    'PDF to Word': 'tools:pdfToWord',
    'Extract Images': 'tools:extractImages',
    'PDF to Markdown': 'tools:pdfToMarkdown',
    'Prepare PDF for AI': 'tools:preparePdfForAi',
    'PDF OCG': 'tools:pdfOcg',
    'PDF to PDF/A': 'tools:pdfToPdfa',
    'Rasterize PDF': 'tools:rasterizePdf',
  };

  // Homepage-only tool grid rendering (not used on individual tool pages)
  if (dom.toolGrid) {
    const CUSTOM_POPULAR_KEY = 'customPopularTools';
    let expandedCategories = new Set<string>();

    const filteredCategories = categories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) => !isToolDisabled(tool.id)),
      }))
      .filter((category) => category.tools.length > 0);

    type ToolItem = (typeof filteredCategories)[number]['tools'][number];

    const allToolsById = new Map<string, ToolItem>();
    for (const category of filteredCategories) {
      for (const tool of category.tools) {
        allToolsById.set(tool.id, tool);
      }
    }

    function getCustomPopular(): string[] | null {
      try {
        const stored = getStoredItem(CUSTOM_POPULAR_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string')
          : null;
      } catch {
        return null;
      }
    }

    function saveCustomPopular(list: string[]) {
      setStoredItem(CUSTOM_POPULAR_KEY, JSON.stringify(list));
    }

    function resolvePopularTools(): ToolItem[] {
      const custom = getCustomPopular();
      if (custom && custom.length > 0) {
        return custom
          .map((id) => allToolsById.get(id))
          .filter((t): t is ToolItem => Boolean(t));
      }
      const popularCategory = filteredCategories.find(
        (c) => c.name === 'Popular Tools'
      );
      return popularCategory ? popularCategory.tools : [];
    }

    let activeActionCard: HTMLElement | null = null;
    function showCardActions(card: HTMLElement) {
      if (activeActionCard && activeActionCard !== card) {
        activeActionCard.classList.remove('card-actions-active');
      }
      activeActionCard = card;
      card.classList.add('card-actions-active');
    }
    function clearCardActions() {
      if (activeActionCard) {
        activeActionCard.classList.remove('card-actions-active');
        activeActionCard = null;
      }
    }

    function defaultPopularIds(): string[] {
      const popularCategory = filteredCategories.find(
        (c) => c.name === 'Popular Tools'
      );
      return popularCategory ? popularCategory.tools.map((t) => t.id) : [];
    }

    function movePopular(toolId: string, dir: -1 | 1) {
      const custom = getCustomPopular() ?? defaultPopularIds();
      const idx = custom.indexOf(toolId);
      if (idx === -1) return;
      const target = idx + dir;
      if (target < 0 || target >= custom.length) return;
      const next = [...custom];
      [next[idx], next[target]] = [next[target], next[idx]];
      saveCustomPopular(next);
      clearCardActions();
      renderToolGrid();
    }

    const actionStyle = document.createElement('style');
    actionStyle.textContent =
      '.card-actions-active .tool-card-action-btn, .card-actions-active .tool-card-actions { opacity: 1 !important; }';
    document.head.appendChild(actionStyle);

    function buildToolCard(
      tool: ToolItem,
      isPopular: boolean,
      inPopular: boolean
    ): HTMLElement {
      let toolCard: HTMLDivElement | HTMLAnchorElement;

      const baseClass = isPopular
        ? 'tool-card group relative block bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl p-6 cursor-pointer flex flex-col items-center justify-center text-center no-underline border border-indigo-500/30 hover:border-indigo-400 hover:shadow-xl transition duration-200'
        : 'tool-card group relative bg-gray-800/60 rounded-lg p-3 cursor-pointer flex flex-col items-center justify-center text-center hover:bg-gray-700/60 transition duration-200';

      if (tool.href) {
        toolCard = document.createElement('a');
        toolCard.href = tool.href;
      } else {
        toolCard = document.createElement('div');
        (toolCard as HTMLDivElement).dataset.toolId = tool.id;
      }
      toolCard.className = baseClass;

      const icon = document.createElement('i');
      if (tool.icon.startsWith('ph-')) {
        icon.className = isPopular
          ? `ph ${tool.icon} text-5xl mb-4 text-indigo-400`
          : `ph ${tool.icon} text-2xl mb-2 text-gray-500`;
      } else {
        icon.setAttribute('data-lucide', tool.icon);
      }

      const toolName = document.createElement('h3');
      const toolKey = toolTranslationKeys[tool.name];
      toolName.textContent = toolKey ? t(`${toolKey}.name`) : tool.name;
      toolName.className = isPopular
        ? 'text-lg font-bold text-white'
        : 'text-sm font-medium text-gray-200';

      toolCard.append(icon, toolName);

      if (tool.subtitle) {
        const toolSubtitle = document.createElement('p');
        toolSubtitle.className = isPopular
          ? 'text-sm text-gray-300 mt-1.5 px-2'
          : 'text-[11px] text-gray-500 mt-0.5 px-1';
        toolSubtitle.textContent = toolKey
          ? t(`${toolKey}.subtitle`)
          : tool.subtitle;
        toolCard.appendChild(toolSubtitle);
      }

      // Right-top action controls: move left/right + remove (popular) or add (all tools)
      const customIds = getCustomPopular() ?? defaultPopularIds();
      const currentIndex = customIds.indexOf(tool.id);

      if (isPopular) {
        const actions = document.createElement('div');
        actions.className =
          'tool-card-actions absolute top-2 right-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 z-10';

        const makeBtn = (
          iconName: string,
          title: string,
          disabled: boolean,
          variant: 'neutral' | 'danger',
          onClick?: () => void
        ) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.title = title;
          const icon = document.createElement('i');
          icon.setAttribute('data-lucide', iconName);
          icon.className = 'w-4 h-4';
          btn.appendChild(icon);
          btn.className =
            `w-8 h-8 rounded-lg flex items-center justify-center border shadow-md transition-all duration-150 ` +
            (disabled
              ? 'bg-gray-800/70 text-gray-600 border-gray-700 cursor-default'
              : variant === 'danger'
                ? 'bg-red-500/90 text-white border-red-400/50 hover:bg-red-500 hover:scale-105'
                : 'bg-gray-700/90 text-white border-gray-500/50 hover:bg-gray-600 hover:scale-105');
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && onClick) onClick();
          });
          return btn;
        };

        actions.append(
          makeBtn(
            'arrow-left',
            'Move left',
            currentIndex <= 0,
            'neutral',
            () => movePopular(tool.id, -1)
          ),
          makeBtn(
            'arrow-right',
            'Move right',
            currentIndex === -1 || currentIndex >= customIds.length - 1,
            'neutral',
            () => movePopular(tool.id, 1)
          ),
          makeBtn(
            'x',
            'Remove from Popular',
            false,
            'danger',
            () => {
              const custom = getCustomPopular() ?? defaultPopularIds();
              saveCustomPopular(custom.filter((id) => id !== tool.id));
              clearCardActions();
              renderToolGrid();
            }
          )
        );
        toolCard.appendChild(actions);
      } else {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className =
          'tool-card-action-btn absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center border shadow-md opacity-0 transition-opacity duration-150 ' +
          (inPopular
            ? 'bg-gray-800/70 text-gray-500 border-gray-700 cursor-default'
            : 'bg-teal-500/90 text-white border-teal-400/50 hover:bg-teal-500 hover:scale-105');
        actionBtn.title = inPopular ? 'Already in Popular' : 'Add to Popular';
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', inPopular ? 'check' : 'plus');
        icon.className = 'w-4 h-4';
        actionBtn.appendChild(icon);

        if (!inPopular) {
          actionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const custom = getCustomPopular() ?? defaultPopularIds();
            saveCustomPopular([...custom, tool.id]);
            clearCardActions();
            renderToolGrid();
          });
        } else {
          actionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        }
        toolCard.appendChild(actionBtn);
      }

      // Desktop: right-click activates the action buttons
      toolCard.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showCardActions(toolCard as HTMLElement);
      });

      // While edit state is active, clicking the card body only cancels
      // editing (does NOT navigate). Click again to open the tool.
      toolCard.addEventListener('click', (e) => {
        if (toolCard.classList.contains('card-actions-active')) {
          e.preventDefault();
          clearCardActions();
        }
      });

      // Mobile: long-press activates the action buttons
      let longPressTimer: ReturnType<typeof setTimeout> | null = null;
      toolCard.addEventListener(
        'touchstart',
        () => {
          if (longPressTimer) clearTimeout(longPressTimer);
          longPressTimer = setTimeout(() => {
            showCardActions(toolCard as HTMLElement);
          }, 500);
        },
        { passive: true }
      );
      const cancelLongPress = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };
      toolCard.addEventListener('touchend', cancelLongPress);
      toolCard.addEventListener('touchmove', cancelLongPress);
      toolCard.addEventListener('touchcancel', cancelLongPress);

      return toolCard as HTMLElement;
    }

    function renderToolGrid() {
      dom.toolGrid.textContent = '';

      const popularTools = resolvePopularTools();
      const popularIds = new Set(popularTools.map((t) => t.id));

      let popularContainer: HTMLDivElement | null = null;
      let allToolsContainer: HTMLDivElement | null = null;

      filteredCategories.forEach((category) => {
        const isPopular = category.name === 'Popular Tools';

        if (isPopular && !popularContainer) {
          popularContainer = document.createElement('div');
          popularContainer.className =
            'col-span-full mt-10 rounded-2xl border-2 border-gray-400/70 p-4 md:p-6';

          // Header row: title + reset button
          const popularHeader = document.createElement('div');
          popularHeader.className = 'flex items-center justify-between mb-4';
          const popularTitle = document.createElement('h2');
          const popularKey = categoryTranslationKeys[category.name];
          popularTitle.textContent = popularKey
            ? t(popularKey)
            : category.name;
          popularTitle.className = 'text-2xl md:text-3xl font-bold text-white';

          const resetBtn = document.createElement('button');
          resetBtn.type = 'button';
          const hasCustom = getCustomPopular() !== null;
          const resetIcon = document.createElement('i');
          resetIcon.setAttribute('data-lucide', 'rotate-ccw');
          resetIcon.className = 'w-4 h-4';
          const resetLabel = document.createElement('span');
          resetLabel.textContent = '恢复默认';
          resetBtn.className =
            'flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3.5 py-2 border shadow-md transition-all bg-amber-500 text-white border-amber-400 hover:bg-amber-400 hover:shadow-lg';
          resetBtn.title = hasCustom
            ? '恢复默认热门工具'
            : '当前已是默认热门工具';
          resetBtn.append(resetIcon, resetLabel);
          resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!getCustomPopular()) return;
            removeStoredItem(CUSTOM_POPULAR_KEY);
            clearCardActions();
            renderToolGrid();
          });

          popularHeader.append(popularTitle, resetBtn);
          popularContainer.appendChild(popularHeader);

          const toolsContainer = document.createElement('div');
          toolsContainer.className =
            'category-tools grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6';

          if (popularTools.length === 0) {
            const empty = document.createElement('p');
            empty.className =
              'col-span-full text-gray-500 text-sm text-center py-6';
            empty.textContent =
              'No popular tools yet. Right-click (or long-press) a tool in All Tools to add it here.';
            toolsContainer.appendChild(empty);
          } else {
            popularTools.forEach((tool) => {
              toolsContainer.appendChild(buildToolCard(tool, true, true));
            });
          }

          popularContainer.appendChild(toolsContainer);
          dom.toolGrid.appendChild(popularContainer);
          return;
        }

        if (!isPopular && !allToolsContainer) {
          allToolsContainer = document.createElement('div');
          allToolsContainer.className =
            'col-span-full mt-10 rounded-2xl border-2 border-gray-400/70 p-4 md:p-6';

          const divider = document.createElement('div');
          divider.className = 'flex items-center gap-4 mb-4 select-none';
          const dividerLabel = document.createElement('span');
          dividerLabel.className =
            'text-xs font-semibold uppercase tracking-widest text-gray-500';
          dividerLabel.textContent = 'All Tools';
          const dividerLine = document.createElement('span');
          dividerLine.className = 'flex-1 h-px bg-gray-700';
          divider.append(dividerLabel, dividerLine);
          allToolsContainer.appendChild(divider);
          dom.toolGrid.appendChild(allToolsContainer);
        }

        const categoryGroup = document.createElement('div');
        const categorySlug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        categoryGroup.className = `category-group col-span-full is-cat-${categorySlug}`;

        const header = document.createElement('button');
        header.className = 'category-header';
        header.type = 'button';

        const title = document.createElement('span');
        const categoryKey = categoryTranslationKeys[category.name];
        title.textContent = categoryKey ? t(categoryKey) : category.name;
        title.className =
          'inline-block rounded-md bg-gray-200 text-gray-900 text-sm font-semibold px-3 py-1.5';

        const chevron = document.createElement('i');
        chevron.setAttribute('data-lucide', 'chevron-down');
        chevron.className =
          'category-chevron w-5 h-5 text-gray-400 transition-transform duration-300';

        header.append(title, chevron);

        const toolsContainer = document.createElement('div');
        toolsContainer.className =
          'category-tools grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4';

        const isCollapsed = !expandedCategories.has(category.name);
        if (isCollapsed) {
          categoryGroup.classList.add('collapsed');
          toolsContainer.style.maxHeight = '0px';
        }

        toolsContainer.addEventListener('transitionend', (e) => {
          if ((e as TransitionEvent).propertyName !== 'max-height') return;
          if (!categoryGroup.classList.contains('collapsed')) {
            toolsContainer.style.maxHeight = 'none';
            toolsContainer.style.overflow = 'visible';
          }
        });

        header.addEventListener('click', () => {
          const collapsed = categoryGroup.classList.toggle('collapsed');
          if (collapsed) {
            toolsContainer.style.maxHeight =
              toolsContainer.scrollHeight + 'px';
            toolsContainer.style.overflow = 'hidden';
            requestAnimationFrame(() => {
              toolsContainer.style.maxHeight = '0px';
            });
            expandedCategories.delete(category.name);
          } else {
            toolsContainer.style.overflow = 'hidden';
            toolsContainer.style.maxHeight =
              toolsContainer.scrollHeight + 'px';
            expandedCategories.add(category.name);
          }
        });

        category.tools.forEach((tool) => {
          toolsContainer.appendChild(
            buildToolCard(tool, false, popularIds.has(tool.id))
          );
        });

        categoryGroup.append(header, toolsContainer);
        allToolsContainer!.appendChild(categoryGroup);

        if (!isCollapsed) {
          toolsContainer.style.maxHeight = 'none';
          toolsContainer.style.overflow = 'visible';
        }
      });

      // Search results container (recreated on each render)
      const searchResultsContainer = document.createElement('div');
      searchResultsContainer.id = 'search-results';
      searchResultsContainer.className =
        'hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 col-span-full';
      dom.toolGrid.insertBefore(
        searchResultsContainer,
        dom.toolGrid.firstChild
      );

      createIcons({ icons });
    }

    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
      searchBar.addEventListener('input', () => {
        const searchTerm = (searchBar as HTMLInputElement).value
          .toLowerCase()
          .trim();

        let searchResultsContainer = document.getElementById('search-results');
        if (!searchResultsContainer) {
          searchResultsContainer = document.createElement('div');
          searchResultsContainer.id = 'search-results';
          searchResultsContainer.className =
            'hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 col-span-full';
          dom.toolGrid.insertBefore(
            searchResultsContainer,
            dom.toolGrid.firstChild
          );
        }
        const categoryGroups = dom.toolGrid.querySelectorAll('.category-group');

        if (!searchTerm) {
          searchResultsContainer.classList.add('hidden');
          searchResultsContainer.innerHTML = '';
          categoryGroups.forEach((group) => {
            (group as HTMLElement).style.display = '';
            group.querySelectorAll('.tool-card').forEach((card) => {
              (card as HTMLElement).style.display = '';
            });
          });
          return;
        }

        categoryGroups.forEach((group) => {
          (group as HTMLElement).style.display = 'none';
        });

        searchResultsContainer.innerHTML = '';
        searchResultsContainer.classList.remove('hidden');

        const seenToolIds = new Set<string>();
        const allTools: HTMLElement[] = [];

        categoryGroups.forEach((group) => {
          group.querySelectorAll('.tool-card').forEach((card) => {
            const toolName = (
              card.querySelector('h3')?.textContent || ''
            ).toLowerCase();
            const toolSubtitle = (
              card.querySelector('p')?.textContent || ''
            ).toLowerCase();
            const toolHref =
              (card as HTMLAnchorElement).href ||
              (card as HTMLElement).dataset.toolId ||
              '';
            const toolId =
              toolHref.split('/').pop()?.replace('.html', '') || toolName;

            const isMatch =
              toolName.includes(searchTerm) ||
              toolSubtitle.includes(searchTerm);
            if (isMatch && !seenToolIds.has(toolId)) {
              seenToolIds.add(toolId);
              const clone = card.cloneNode(true) as HTMLElement;
              clone.querySelector('.tool-card-actions')?.remove();
              clone.querySelector('.tool-card-action-btn')?.remove();
              clone.classList.remove('card-actions-active');
              allTools.push(clone);
            }
          });
        });

        allTools.forEach((tool) => searchResultsContainer!.appendChild(tool));
        createIcons({ icons });
      });
    }

    window.addEventListener('keydown', function (e) {
      const key = e.key.toLowerCase();
      const isMac = navigator.userAgent.toUpperCase().includes('MAC');
      const isCtrlK = e.ctrlKey && key === 'k';
      const isCmdK = isMac && e.metaKey && key === 'k';

      if (isCtrlK || isCmdK) {
        e.preventDefault();
        searchBar?.focus();
      }
    });

    // Any click that reaches the document cancels the edit state: clicking a
    // card (non-button area), another card, or anywhere else on the page.
    // Action buttons stop propagation, so their clicks never reach here.
    document.addEventListener('click', () => {
      clearCardActions();
    });

    renderToolGrid();
  }

  if (dom.backToGridBtn) {
    dom.backToGridBtn.addEventListener('click', () => switchView('grid'));
  }

  if (dom.alertOkBtn) {
    dom.alertOkBtn.addEventListener('click', hideAlert);
  }

  const faqAccordion = document.getElementById('faq-accordion');
  if (faqAccordion) {
    faqAccordion.addEventListener('click', (e) => {
      // @ts-expect-error TS(2339) FIXME: Property 'closest' does not exist on type 'EventTa... Remove this comment to see the full error message
      const questionButton = e.target.closest('.faq-question');
      if (!questionButton) return;

      const faqItem = questionButton.parentElement;
      const answer = faqItem.querySelector('.faq-answer');

      faqItem.classList.toggle('open');

      if (faqItem.classList.contains('open')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0px';
      }
    });
  }

  const faqDetails =
    document.querySelectorAll<HTMLDetailsElement>('details.faq-d');
  if (
    faqDetails.length > 0 &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    faqDetails.forEach((detail) => {
      const summary = detail.querySelector('summary');
      const body = detail.querySelector<HTMLElement>('.faq-d-a');
      if (!summary || !body) return;

      let animation: Animation | null = null;

      summary.addEventListener('click', (event) => {
        event.preventDefault();
        animation?.cancel();

        const wasOpen = detail.open;
        if (!wasOpen) detail.open = true;

        const fullHeight = `${body.scrollHeight}px`;
        const fullPadding = window.getComputedStyle(body).paddingBottom;
        const collapsed = { height: '0px', paddingBottom: '0px', opacity: 0 };
        const expanded = {
          height: fullHeight,
          paddingBottom: fullPadding,
          opacity: 1,
        };

        body.style.overflow = 'hidden';
        animation = body.animate(
          wasOpen ? [expanded, collapsed] : [collapsed, expanded],
          { duration: 280, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
        );
        animation.onfinish = () => {
          if (wasOpen) detail.open = false;
          body.style.overflow = '';
          animation = null;
        };
      });
    });
  }

  createIcons({ icons });
  console.log('Please share our tool and share the love!');

  // Initialize Shortcuts System
  ShortcutsManager.init();

  // Tab switching for settings modal
  const shortcutsTabBtn = document.getElementById('shortcuts-tab-btn');
  const preferencesTabBtn = document.getElementById('preferences-tab-btn');
  const shortcutsTabContent = document.getElementById('shortcuts-tab-content');
  const preferencesTabContent = document.getElementById(
    'preferences-tab-content'
  );
  const shortcutsTabFooter = document.getElementById('shortcuts-tab-footer');
  const preferencesTabFooter = document.getElementById(
    'preferences-tab-footer'
  );
  const resetShortcutsBtn = document.getElementById('reset-shortcuts-btn');

  if (shortcutsTabBtn && preferencesTabBtn) {
    shortcutsTabBtn.addEventListener('click', () => {
      shortcutsTabBtn.classList.add('bg-indigo-600', 'text-white');
      shortcutsTabBtn.classList.remove('text-gray-300');
      preferencesTabBtn.classList.remove('bg-indigo-600', 'text-white');
      preferencesTabBtn.classList.add('text-gray-300');
      shortcutsTabContent?.classList.remove('hidden');
      preferencesTabContent?.classList.add('hidden');
      shortcutsTabFooter?.classList.remove('hidden');
      preferencesTabFooter?.classList.add('hidden');
      resetShortcutsBtn?.classList.remove('hidden');
    });

    preferencesTabBtn.addEventListener('click', () => {
      preferencesTabBtn.classList.add('bg-indigo-600', 'text-white');
      preferencesTabBtn.classList.remove('text-gray-300');
      shortcutsTabBtn.classList.remove('bg-indigo-600', 'text-white');
      shortcutsTabBtn.classList.add('text-gray-300');
      preferencesTabContent?.classList.remove('hidden');
      shortcutsTabContent?.classList.add('hidden');
      preferencesTabFooter?.classList.remove('hidden');
      shortcutsTabFooter?.classList.add('hidden');
      resetShortcutsBtn?.classList.add('hidden');
    });
  }

  // Full-width toggle functionality
  const fullWidthToggle = document.getElementById(
    'full-width-toggle'
  ) as HTMLInputElement;
  const toolInterface = document.getElementById('tool-interface');

  const savedFullWidth = getStoredItem('fullWidthMode') !== 'false';
  if (fullWidthToggle) {
    fullWidthToggle.checked = savedFullWidth;
    applyFullWidthMode(savedFullWidth);
  }

  function applyFullWidthMode(enabled: boolean) {
    if (toolInterface) {
      if (enabled) {
        toolInterface.classList.remove('max-w-4xl');
      } else {
        toolInterface.classList.add('max-w-4xl');
      }
    }

    // Apply to all page uploaders
    const pageUploaders = document.querySelectorAll(
      '#tool-uploader, #signature-editor'
    );
    pageUploaders.forEach((uploader) => {
      if (enabled) {
        uploader.classList.remove('max-w-2xl', 'max-w-5xl');
      } else {
        // Restore original max-width (most are max-w-2xl, add-stamps is max-w-5xl)
        if (
          !uploader.classList.contains('max-w-2xl') &&
          !uploader.classList.contains('max-w-5xl')
        ) {
          uploader.classList.add('max-w-2xl');
        }
      }
    });
  }

  if (fullWidthToggle) {
    fullWidthToggle.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      setStoredItem('fullWidthMode', enabled.toString());
      applyFullWidthMode(enabled);
    });
  }

  const compactModeToggle = document.getElementById(
    'compact-mode-toggle'
  ) as HTMLInputElement;

  const savedCompactMode = getStoredItem('compactMode') === 'true';
  if (compactModeToggle) {
    compactModeToggle.checked = savedCompactMode;
  }
  applyCompactMode(savedCompactMode);

  function applyCompactMode(enabled: boolean) {
    if (dom.toolGrid) {
      dom.toolGrid.classList.toggle('compact-mode', enabled);
      dom.toolGrid
        .querySelectorAll('.category-group:not(.collapsed) .category-tools')
        .forEach((container) => {
          (container as HTMLElement).style.maxHeight = 'none';
        });
    }
  }

  if (compactModeToggle) {
    compactModeToggle.addEventListener('change', (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      setStoredItem('compactMode', enabled.toString());
      applyCompactMode(enabled);
    });
  }

  // Shortcuts UI Handlers
  if (dom.openShortcutsBtn) {
    dom.openShortcutsBtn.addEventListener('click', () => {
      renderShortcutsList();
      dom.shortcutsModal.classList.remove('hidden');
    });
  }

  if (dom.closeShortcutsModalBtn) {
    dom.closeShortcutsModalBtn.addEventListener('click', () => {
      dom.shortcutsModal.classList.add('hidden');
    });
  }

  // Close modal on outside click
  if (dom.shortcutsModal) {
    dom.shortcutsModal.addEventListener('click', (e) => {
      if (e.target === dom.shortcutsModal) {
        dom.shortcutsModal.classList.add('hidden');
      }
    });
  }

  if (dom.resetShortcutsBtn) {
    dom.resetShortcutsBtn.addEventListener('click', async () => {
      const confirmed = await showWarningModal(
        t('settings.warnings.resetTitle'),
        t('settings.warnings.resetMessage'),
        true
      );

      if (confirmed) {
        ShortcutsManager.reset();
        renderShortcutsList();
      }
    });
  }

  if (dom.exportShortcutsBtn) {
    dom.exportShortcutsBtn.addEventListener('click', () => {
      ShortcutsManager.exportSettings();
    });
  }

  if (dom.importShortcutsBtn) {
    dom.importShortcutsBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const content = e.target?.result as string;
            if (ShortcutsManager.importSettings(content)) {
              renderShortcutsList();
              await showWarningModal(
                t('settings.warnings.importSuccessTitle'),
                t('settings.warnings.importSuccessMessage'),
                false
              );
            } else {
              await showWarningModal(
                t('settings.warnings.importFailTitle'),
                t('settings.warnings.importFailMessage'),
                false
              );
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }

  if (dom.shortcutSearch) {
    dom.shortcutSearch.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      const sections = dom.shortcutsList.querySelectorAll('.category-section');

      sections.forEach((section) => {
        const items = section.querySelectorAll('.shortcut-item');
        let visibleCount = 0;

        items.forEach((item) => {
          const text = item.textContent?.toLowerCase() || '';
          if (text.includes(term)) {
            item.classList.remove('hidden');
            visibleCount++;
          } else {
            item.classList.add('hidden');
          }
        });

        if (visibleCount === 0) {
          section.classList.add('hidden');
        } else {
          section.classList.remove('hidden');
        }
      });
    });
  }

  // Reserved shortcuts that commonly conflict with browser/OS functions
  const RESERVED_SHORTCUTS: Record<string, { mac?: string; windows?: string }> =
    {
      'mod+w': { mac: 'Closes tab', windows: 'Closes tab' },
      'mod+t': { mac: 'Opens new tab', windows: 'Opens new tab' },
      'mod+n': { mac: 'Opens new window', windows: 'Opens new window' },
      'mod+shift+n': {
        mac: 'Opens incognito window',
        windows: 'Opens incognito window',
      },
      'mod+q': { mac: 'Quits application (cannot be overridden)' },
      'mod+m': { mac: 'Minimizes window' },
      'mod+h': { mac: 'Hides window' },
      'mod+r': { mac: 'Reloads page', windows: 'Reloads page' },
      'mod+shift+r': { mac: 'Hard reloads page', windows: 'Hard reloads page' },
      'mod+l': { mac: 'Focuses address bar', windows: 'Focuses address bar' },
      'mod+d': { mac: 'Bookmarks page', windows: 'Bookmarks page' },
      'mod+shift+t': {
        mac: 'Reopens closed tab',
        windows: 'Reopens closed tab',
      },
      'mod+shift+w': { mac: 'Closes window', windows: 'Closes window' },
      'mod+tab': { mac: 'Switches tabs', windows: 'Switches apps' },
      'alt+f4': { windows: 'Closes window' },
      'ctrl+tab': { mac: 'Switches tabs', windows: 'Switches tabs' },
    };

  function getReservedShortcutWarning(
    combo: string,
    isMac: boolean
  ): string | null {
    const reserved = RESERVED_SHORTCUTS[combo];
    if (!reserved) return null;

    const description = isMac ? reserved.mac : reserved.windows;
    if (!description) return null;

    return description;
  }

  function showWarningModal(
    title: string,
    message: string,
    confirmMode: boolean = true
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (
        !dom.warningModal ||
        !dom.warningTitle ||
        !dom.warningMessage ||
        !dom.warningCancelBtn ||
        !dom.warningConfirmBtn
      ) {
        resolve(confirmMode ? confirm(message) : (alert(message), true));
        return;
      }

      dom.warningTitle.textContent = title;
      dom.warningMessage.innerHTML = message;
      dom.warningModal.classList.remove('hidden');
      dom.warningModal.classList.add('flex');

      if (confirmMode) {
        dom.warningCancelBtn.style.display = '';
        dom.warningConfirmBtn.textContent = t('warning.proceed');
      } else {
        dom.warningCancelBtn.style.display = 'none';
        dom.warningConfirmBtn.textContent = t('alert.ok');
      }

      const handleConfirm = () => {
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      const cleanup = () => {
        dom.warningModal?.classList.add('hidden');
        dom.warningModal?.classList.remove('flex');
        dom.warningConfirmBtn?.removeEventListener('click', handleConfirm);
        dom.warningCancelBtn?.removeEventListener('click', handleCancel);
      };

      dom.warningConfirmBtn.addEventListener('click', handleConfirm);
      dom.warningCancelBtn.addEventListener('click', handleCancel);

      // Close on backdrop click
      dom.warningModal.addEventListener(
        'click',
        (e) => {
          if (e.target === dom.warningModal) {
            if (confirmMode) {
              handleCancel();
            } else {
              handleConfirm();
            }
          }
        },
        { once: true }
      );
    });
  }

  function getToolId(tool: { id?: string; href?: string }): string {
    if (tool.id) return tool.id;
    if (tool.href) {
      const match = tool.href.match(/\/([^/]+)\.html$/);
      return match ? match[1] : tool.href;
    }
    return 'unknown';
  }

  function renderShortcutsList() {
    if (!dom.shortcutsList) return;
    dom.shortcutsList.innerHTML = '';

    const allShortcuts = ShortcutsManager.getAllShortcuts();
    const isMac = navigator.userAgent.toUpperCase().includes('MAC');
    const shortcutCategories = categories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) => !isToolDisabled(tool.id)),
      }))
      .filter((category) => category.tools.length > 0);
    const allTools = shortcutCategories.flatMap((c) => c.tools);

    shortcutCategories.forEach((category) => {
      const section = document.createElement('div');
      section.className = 'category-section mb-6 last:mb-0';

      const header = document.createElement('h3');
      header.className =
        'text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 pl-1';
      const categoryKey = categoryTranslationKeys[category.name];
      header.textContent = categoryKey ? t(categoryKey) : category.name;
      section.appendChild(header);

      const itemsContainer = document.createElement('div');
      itemsContainer.className = 'space-y-2';
      section.appendChild(itemsContainer);

      let hasTools = false;

      category.tools.forEach((tool) => {
        hasTools = true;
        const toolId = getToolId(tool);
        const currentShortcut = allShortcuts.get(toolId) || '';

        const item = document.createElement('div');
        item.className =
          'shortcut-item flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors';

        const left = document.createElement('div');
        left.className = 'flex items-center gap-3';

        const icon = document.createElement('i');
        if (tool.icon.startsWith('ph-')) {
          icon.className = `ph ${tool.icon} w-5 h-5 text-indigo-400`;
        } else {
          icon.className = 'w-5 h-5 text-indigo-400';
          icon.setAttribute('data-lucide', tool.icon);
        }

        const name = document.createElement('span');
        name.className = 'text-gray-200 font-medium';
        const toolKey = toolTranslationKeys[tool.name];
        name.textContent = toolKey ? t(`${toolKey}.name`) : tool.name;

        left.append(icon, name);

        const right = document.createElement('div');
        right.className = 'relative';

        const input = document.createElement('input');
        input.type = 'text';
        input.className =
          'shortcut-input w-32 bg-gray-800 border border-gray-600 text-white text-center text-sm rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all';
        input.placeholder = t('settings.clickToSet');
        input.value = formatShortcutDisplay(currentShortcut, isMac);
        input.readOnly = true;

        const clearBtn = document.createElement('button');
        clearBtn.className =
          'absolute -right-2 -top-2 bg-gray-700 hover:bg-red-600 text-white rounded-full p-0.5 hidden group-hover:block shadow-sm';
        clearBtn.innerHTML = '<i data-lucide="x" class="w-3 h-3"></i>';
        if (currentShortcut) {
          right.classList.add('group');
        }

        clearBtn.onclick = (e) => {
          e.stopPropagation();
          ShortcutsManager.setShortcut(toolId, '');
          renderShortcutsList();
        };

        input.onkeydown = async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (e.key === 'Backspace' || e.key === 'Delete') {
            ShortcutsManager.setShortcut(toolId, '');
            renderShortcutsList();
            return;
          }

          const keys: string[] = [];
          // On Mac: metaKey = Command, ctrlKey = Control
          // On Windows/Linux: metaKey is rare, ctrlKey = Ctrl
          if (isMac) {
            if (e.metaKey) keys.push('mod'); // Command on Mac
            if (e.ctrlKey) keys.push('ctrl'); // Control on Mac (separate from Command)
          } else {
            if (e.ctrlKey || e.metaKey) keys.push('mod'); // Ctrl on Windows/Linux
          }
          if (e.altKey) keys.push('alt');
          if (e.shiftKey) keys.push('shift');

          let key = e.key.toLowerCase();

          if (e.altKey && e.code) {
            if (e.code.startsWith('Key')) {
              key = e.code.slice(3).toLowerCase();
            } else if (e.code.startsWith('Digit')) {
              key = e.code.slice(5);
            }
          }

          const isModifier = ['control', 'shift', 'alt', 'meta'].includes(key);
          const isDeadKey = key === 'dead' || key.startsWith('dead');

          // Ignore dead keys (used for accented characters on Mac with Option key)
          if (isDeadKey) {
            input.value = formatShortcutDisplay(
              ShortcutsManager.getShortcut(toolId) || '',
              isMac
            );
            return;
          }

          if (!isModifier) {
            keys.push(key);
          }

          const combo = keys.join('+');

          input.value = formatShortcutDisplay(combo, isMac);

          if (!isModifier) {
            const existingToolId = ShortcutsManager.findToolByShortcut(combo);

            if (existingToolId && existingToolId !== toolId) {
              const existingTool = allTools.find(
                (t) => getToolId(t) === existingToolId
              );
              const existingToolName = existingTool?.name || existingToolId;
              const displayCombo = formatShortcutDisplay(combo, isMac);

              const existingToolKey = existingTool
                ? toolTranslationKeys[existingTool.name]
                : null;
              const translatedToolName = existingToolKey
                ? t(`${existingToolKey}.name`)
                : existingToolName;

              await showWarningModal(
                t('settings.warnings.alreadyInUse'),
                `<strong>${escapeHtml(displayCombo)}</strong> ${t('settings.warnings.assignedTo')}<br><br>` +
                  `<em>"${escapeHtml(translatedToolName)}"</em><br><br>` +
                  t('settings.warnings.chooseDifferent'),
                false
              );

              input.value = formatShortcutDisplay(
                ShortcutsManager.getShortcut(toolId) || '',
                isMac
              );
              input.classList.remove('border-indigo-500', 'text-indigo-400');
              input.blur();
              return;
            }

            const reservedWarning = getReservedShortcutWarning(combo, isMac);
            if (reservedWarning) {
              const displayCombo = formatShortcutDisplay(combo, isMac);
              const shouldProceed = await showWarningModal(
                t('settings.warnings.reserved'),
                `<strong>${escapeHtml(displayCombo)}</strong> ${t('settings.warnings.commonlyUsed')}<br><br>` +
                  `"<em>${escapeHtml(reservedWarning)}</em>"<br><br>` +
                  `${t('settings.warnings.unreliable')}<br><br>` +
                  t('settings.warnings.useAnyway')
              );

              if (!shouldProceed) {
                // Revert display
                input.value = formatShortcutDisplay(
                  ShortcutsManager.getShortcut(toolId) || '',
                  isMac
                );
                input.classList.remove('border-indigo-500', 'text-indigo-400');
                input.blur();
                return;
              }
            }

            ShortcutsManager.setShortcut(toolId, combo);
            // Re-render to update all inputs (show conflicts in real-time)
            renderShortcutsList();
          }
        };

        input.onkeyup = (e) => {
          // If the user releases a modifier without pressing a main key, revert to saved
          const key = e.key.toLowerCase();
          if (['control', 'shift', 'alt', 'meta'].includes(key)) {
            const currentSaved = ShortcutsManager.getShortcut(toolId);
          }
        };

        input.onfocus = () => {
          input.value = t('settings.pressKeys');
          input.classList.add('border-indigo-500', 'text-indigo-400');
        };

        input.onblur = () => {
          input.value = formatShortcutDisplay(
            ShortcutsManager.getShortcut(toolId) || '',
            isMac
          );
          input.classList.remove('border-indigo-500', 'text-indigo-400');
        };

        right.append(input);
        if (currentShortcut) right.append(clearBtn);

        item.append(left, right);
        itemsContainer.appendChild(item);
      });

      if (hasTools) {
        dom.shortcutsList.appendChild(section);
      }
    });

    createIcons({ icons });
  }

  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');

  if (scrollToTopBtn) {
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY && currentScrollY > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }

      lastScrollY = currentScrollY;
    });

    scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    });
  }

  // Rewrite links after all dynamic content is fully loaded
  rewriteLinks();
};

window.addEventListener('load', init);
