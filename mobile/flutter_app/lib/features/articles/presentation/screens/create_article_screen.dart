import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:flutter_quill_extensions/flutter_quill_extensions.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';

import '../../../../core/feed_notifier.dart';
import '../../../../data/article_repository.dart';
import '../../../../data/section_repository.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../l10n/l10n.dart';
import '../../../../models/section.dart';

const _defaultCoverColor = Color(0xFF2563EB);

class CreateArticleScreen extends StatefulWidget {
  const CreateArticleScreen({super.key});

  @override
  State<CreateArticleScreen> createState() => _CreateArticleScreenState();
}

class _CreateArticleScreenState extends State<CreateArticleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _summaryController = TextEditingController();
  late final quill.QuillController _contentController;
  final _contentFocusNode = FocusNode();
  final ScrollController _contentScrollController = ScrollController();
  final ScrollController _colorPickerScrollController = ScrollController();
  final _imagePicker = ImagePicker();
  final _articleRepository = ArticleRepository();
  final _sectionRepository = SectionRepository();
  late AppLocalizations _l10n;

  late Future<List<Section>> _sectionsFuture;
  String? _selectedSection;
  bool _isSubmitting = false;
  bool _contentDirty = false;
  String? _contentError;

  Color _pickerColor = _defaultCoverColor;
  Color? _selectedCoverColor;

  @override
  void initState() {
    super.initState();
    _sectionsFuture = _sectionRepository.fetchSections();
    _contentController = quill.QuillController.basic();
    _contentController.addListener(_onContentChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _l10n = context.l10n;
  }

  @override
  void dispose() {
    _titleController.dispose();
    _summaryController.dispose();
    _contentController.removeListener(_onContentChanged);
    _contentController.dispose();
    _contentFocusNode.dispose();
    _contentScrollController.dispose();
    _colorPickerScrollController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final formValid = _formKey.currentState?.validate() ?? false;
    final contentValidation = _validateContent();

    if (!formValid || _selectedSection == null || contentValidation != null) {
      setState(() {
        _contentDirty = true;
        _contentError = contentValidation;
      });
      if (contentValidation != null) {
        _contentFocusNode.requestFocus();
      }
      return;
    }

    setState(() => _isSubmitting = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      await _articleRepository.createArticle(
        sectionSlug: _selectedSection!,
        title: _titleController.text.trim(),
        summary: _summaryController.text.trim(),
        content: _buildContentHtml(),
        coverColor: _selectedCoverColorHex(),
      );
      FeedNotifier.instance.articlePublished();
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text(_l10n.articles.create.success)));
      context.pop();
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _onContentChanged() {
    if (!_contentDirty) {
      _contentDirty = true;
    }
    final validation = _validateContent();
    if (validation != _contentError) {
      setState(() => _contentError = validation);
    }
  }

  String? _validateContent() {
    final plain = _contentController.document.toPlainText().trim();
    if (plain.length < 100) {
      return _l10n.articles.create.contentError;
    }
    return null;
  }

  String? _selectedCoverColorHex() {
    final color = _selectedCoverColor;
    if (color == null) return null;
    final argb = color.toARGB32();
    final hex = argb.toRadixString(16).padLeft(8, '0').substring(2).toUpperCase();
    return '#$hex';
  }

  void _handleColorChanged(Color color) {
    setState(() {
      _pickerColor = color;
      _selectedCoverColor = color;
    });
  }

  Future<void> _handleInsertImage() async {
    try {
      final picked = await _imagePicker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (picked == null) return;

      final bytes = await picked.readAsBytes();
      final mimeType = lookupMimeType(picked.path, headerBytes: bytes);
      if (mimeType == null || !mimeType.startsWith('image/')) {
        throw Exception(_l10n.articles.create.invalidImage);
      }

      final dataUri = 'data:$mimeType;base64,${base64Encode(bytes)}';
      final selection = _contentController.selection;
      final index = selection.baseOffset < 0 ? _contentController.document.length : selection.baseOffset;
      final length = selection.extentOffset > selection.baseOffset
          ? selection.extentOffset - selection.baseOffset
          : 0;

      _contentController.replaceText(index, length, quill.BlockEmbed.image(dataUri), null);
      _contentController.replaceText(index + 1, 0, '\n', null);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
      );
    }
  }

  Widget _buildContentComposer() {
    final borderColor = Colors.white.withValues(alpha: 0.08);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(_l10n.articles.create.contentLabel,
          style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: borderColor),
            color: Colors.white.withValues(alpha: 0.02),
          ),
          child: Column(
            children: [
              quill.QuillSimpleToolbar(
                controller: _contentController,
                config: quill.QuillSimpleToolbarConfig(
                  showFontFamily: false,
                  showFontSize: false,
                  showBackgroundColorButton: false,
                  showAlignmentButtons: false,
                  showSearchButton: false,
                  showSmallButton: false,
                  showInlineCode: false,
                  showCodeBlock: false,
                  showQuote: false,
                  embedButtons: [
                    (context, embed) => quill.QuillToolbarIconButton(
                          tooltip: _l10n.articles.create.insertImage,
                          icon: const Icon(Icons.image_outlined, size: 20),
                          iconTheme: embed.iconTheme,
                          isSelected: false,
                          onPressed: _handleInsertImage,
                        ),
                  ],
                ),
              ),
              const Divider(height: 1),
              SizedBox(
                height: 280,
                child: quill.QuillEditor(
                  controller: _contentController,
                  focusNode: _contentFocusNode,
                  scrollController: _contentScrollController,
                  config: quill.QuillEditorConfig(
                    placeholder: _l10n.articles.create.contentPlaceholder,
                    padding: const EdgeInsets.all(16),
                    autoFocus: false,
                    scrollable: true,
                    embedBuilders: FlutterQuillEmbeds.editorBuilders(),
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_contentDirty && _contentError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _contentError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
      ],
    );
  }

  Widget _buildColorPicker() {
    final theme = Theme.of(context);
    final previewColor = _selectedCoverColor ?? _pickerColor;
    final displayText =
      _selectedCoverColor == null ? _l10n.articles.create.noCoverSelected : _selectedCoverColorHex()!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(_l10n.articles.create.coverLabel,
          style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
            color: Colors.white.withValues(alpha: 0.02),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: previewColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      displayText,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  TextButton(
                    onPressed: _selectedCoverColor == null
                        ? null
                        : () => setState(() {
                              _selectedCoverColor = null;
                              _pickerColor = _defaultCoverColor;
                            }),
                    child: Text(_l10n.articles.create.removeCover),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 260,
                child: Scrollbar(
                  controller: _colorPickerScrollController,
                  thumbVisibility: true,
                  child: SingleChildScrollView(
                    controller: _colorPickerScrollController,
                    child: ColorPicker(
                      pickerColor: _selectedCoverColor ?? _pickerColor,
                      onColorChanged: _handleColorChanged,
                      enableAlpha: false,
                      paletteType: PaletteType.hsvWithHue,
                      displayThumbColor: true,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _buildContentHtml() {
    final encoder = _DeltaHtmlEncoder(
      _contentController.document.toDelta().toJson().cast<Map<String, dynamic>>(),
    );
    final html = encoder.convert().trim();
    if (html.isEmpty) {
      return '<p></p>';
    }
    return html;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_l10n.articles.create.title)),
      body: SafeArea(
        child: FutureBuilder<List<Section>>(
          future: _sectionsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError || snapshot.data == null || snapshot.data!.isEmpty) {
              return _ErrorState(onRetry: () {
                setState(() {
                  _sectionsFuture = _sectionRepository.fetchSections();
                });
              });
            }

            final sections = snapshot.data!;
            _selectedSection ??= sections.first.slug;

            return Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                children: [
                  FormField<String>(
                    initialValue: _selectedSection,
                    validator: (value) => value == null ? _l10n.articles.create.sectionError : null,
                    builder: (field) {
                      final effectiveValue = field.value ?? sections.first.slug;
                      return InputDecorator(
                        decoration: InputDecoration(
                          labelText: _l10n.articles.create.sectionLabel,
                          errorText: field.errorText,
                          border: const OutlineInputBorder(),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            isExpanded: true,
                            value: effectiveValue,
                            items: sections
                                .map((section) => DropdownMenuItem(
                                      value: section.slug,
                                      child: Text(section.name),
                                    ))
                                .toList(growable: false),
                            onChanged: (value) {
                              if (value == null) return;
                              field.didChange(value);
                              setState(() => _selectedSection = value);
                            },
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _titleController,
                    decoration:
                        InputDecoration(labelText: _l10n.articles.create.formTitleLabel),
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.length < 6) {
                        return _l10n.articles.create.formTitleShort;
                      }
                      if (text.length > 12) {
                        return _l10n.articles.create.formTitleLong;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _summaryController,
                    maxLines: 3,
                    decoration:
                        InputDecoration(labelText: _l10n.articles.create.formSummaryLabel),
                    validator: (value) {
                      final text = value?.trim() ?? '';
                      if (text.length < 12) {
                        return _l10n.articles.create.formSummaryShort;
                      }
                      if (text.length > 30) {
                        return _l10n.articles.create.formSummaryLong;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildContentComposer(),
                  const SizedBox(height: 16),
                  _buildColorPicker(),
                  const SizedBox(height: 24),
                  FilledButton.icon(
                    onPressed: _isSubmitting ? null : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                    label: Text(
                      _isSubmitting
                          ? _l10n.articles.create.submitting
                          : _l10n.articles.create.submit,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(l10n.sections.loadError, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.common.retry)),
        ],
      ),
    );
  }
}

class _DeltaHtmlEncoder {
  _DeltaHtmlEncoder(this.operations);

  final List<Map<String, dynamic>> operations;
  final StringBuffer _buffer = StringBuffer();
  final StringBuffer _lineBuffer = StringBuffer();
  final List<_ListEntry> _listStack = [];

  static const _inlineKeys = <String>{
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'link',
    'inline-code',
    'subscript',
    'superscript',
    'script',
  };

  static const _blockKeys = <String>{
    'list',
    'header',
    'blockquote',
    'code-block',
    'align',
    'checked',
    'indent',
  };

  static const HtmlEscape _textEscaper = HtmlEscape(HtmlEscapeMode.element);
  static const HtmlEscape _attributeEscaper = HtmlEscape(HtmlEscapeMode.attribute);

  String convert() {
    for (final raw in operations) {
      final insert = raw['insert'];
      final attrs = (raw['attributes'] as Map?)?.cast<String, dynamic>();
      if (insert is String) {
        _writeText(insert, attrs);
      } else if (insert is Map) {
        final imageSrc = insert['image']?.toString();
        if (imageSrc != null && imageSrc.isNotEmpty) {
          _flushCurrentLine(null);
          _closeLists();
          final safe = _attributeEscaper.convert(imageSrc);
          _buffer.write('<p><img src="$safe" alt="Imagen" /></p>');
        }
      }
    }
    _flushCurrentLine(null);
    _closeLists();
    return _buffer.toString();
  }

  void _writeText(String text, Map<String, dynamic>? attrs) {
    final inlineAttrs = _filterAttributes(attrs, _inlineKeys);
    final blockAttrs = _filterAttributes(attrs, _blockKeys);
    var remaining = text;
    while (remaining.isNotEmpty) {
      final newlineIndex = remaining.indexOf('\n');
      if (newlineIndex == -1) {
        if (remaining.isNotEmpty) {
          _lineBuffer.write(_applyInlineStyles(remaining, inlineAttrs));
        }
        break;
      }
      final segment = remaining.substring(0, newlineIndex);
      if (segment.isNotEmpty) {
        _lineBuffer.write(_applyInlineStyles(segment, inlineAttrs));
      }
      _flushCurrentLine(blockAttrs, force: true);
      remaining = remaining.substring(newlineIndex + 1);
    }
  }

  Map<String, dynamic>? _filterAttributes(Map<String, dynamic>? attrs, Set<String> keys) {
    if (attrs == null) return null;
    final map = <String, dynamic>{};
    for (final entry in attrs.entries) {
      if (keys.contains(entry.key)) {
        map[entry.key] = entry.value;
      }
    }
    if (map.isEmpty) return null;
    return map;
  }

  String _applyInlineStyles(String text, Map<String, dynamic>? attrs) {
    if (text.isEmpty) return '';
    var output = _textEscaper.convert(text);
    if (attrs == null || attrs.isEmpty) {
      return output;
    }

    void wrap(String tag, {String? attributes}) {
      final attrsText = attributes == null ? '' : ' $attributes';
      output = '<$tag$attrsText>$output</$tag>';
    }

    if (attrs['inline-code'] == true) {
      wrap('code');
    }
    if (attrs['link'] != null) {
      final href = _attributeEscaper.convert(attrs['link'].toString());
      wrap('a', attributes: 'href="$href" target="_blank" rel="noopener"');
    }
    if (attrs['bold'] == true) {
      wrap('strong');
    }
    if (attrs['italic'] == true) {
      wrap('em');
    }
    if (attrs['underline'] == true) {
      wrap('u');
    }
    if (attrs['strike'] == true) {
      wrap('s');
    }
    final script = attrs['script'] ?? attrs['subscript'] ?? attrs['superscript'];
    if (script == 'sub' || script == 'subscript') {
      wrap('sub');
    } else if (script == 'super' || script == 'superscript') {
      wrap('sup');
    }

    final styleParts = <String>[];
    final color = attrs['color'];
    final background = attrs['background'];
    if (color != null) {
      styleParts.add('color:$color');
    }
    if (background != null) {
      styleParts.add('background-color:$background');
    }
    if (styleParts.isNotEmpty) {
      wrap('span', attributes: 'style="${styleParts.join(';')}"');
    }

    return output;
  }

  void _flushCurrentLine(Map<String, dynamic>? blockAttrs, {bool force = false}) {
    final hasContent = _lineBuffer.isNotEmpty;
    if (!hasContent && !force) {
      if (blockAttrs == null || blockAttrs['list'] == null) {
        _closeLists();
      }
      return;
    }

    final line = _lineBuffer.toString();
    _lineBuffer.clear();

    final listType = blockAttrs?['list']?.toString();
    final indent = (blockAttrs?['indent'] as int?) ?? 0;

    if (listType != null) {
      _openList(listType, indent);
      final checked = blockAttrs?['checked'] == true;
      final attrs = checked ? ' data-checked="true"' : '';
      _buffer.write('<li$attrs>$line</li>');
      return;
    }

    _closeLists();
    final headerLevel = blockAttrs?['header'];
    if (headerLevel is int && headerLevel >= 1 && headerLevel <= 6) {
      _buffer.write('<h$headerLevel>$line</h$headerLevel>');
      return;
    }
    if (blockAttrs?['code-block'] == true) {
      _buffer.write('<pre><code>$line</code></pre>');
      return;
    }
    if (blockAttrs?['blockquote'] == true) {
      _buffer.write('<blockquote>$line</blockquote>');
      return;
    }

    final align = blockAttrs?['align'];
    if (align is String && align.isNotEmpty) {
      final style = _attributeEscaper.convert('text-align:$align');
      _buffer.write('<p style="$style">$line</p>');
    } else {
      _buffer.write('<p>$line</p>');
    }
  }

  void _openList(String type, int indent) {
    while (_listStack.isNotEmpty && _listStack.last.indent > indent) {
      _buffer.write('</${_listStack.removeLast().tag}>');
    }
    if (_listStack.isNotEmpty && _listStack.last.indent == indent && _listStack.last.type != type) {
      _buffer.write('</${_listStack.removeLast().tag}>');
    }
    if (_listStack.isEmpty || _listStack.last.indent < indent || _listStack.last.type != type) {
      final entry = _ListEntry(type, indent);
      _listStack.add(entry);
      _buffer.write('<${entry.tag}>');
    }
  }

  void _closeLists() {
    while (_listStack.isNotEmpty) {
      _buffer.write('</${_listStack.removeLast().tag}>');
    }
  }
}

class _ListEntry {
  const _ListEntry(this.type, this.indent);

  final String type;
  final int indent;

  String get tag => type == 'ordered' ? 'ol' : 'ul';
}
