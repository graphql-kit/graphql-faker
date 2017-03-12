import React, { PropTypes } from 'react';

import marked from 'marked';
import CodeMirror from 'codemirror';

import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/lint/lint';
import 'codemirror/keymap/sublime';
import 'codemirror/keymap/sublime';
import 'codemirror-graphql/hint';
import 'codemirror-graphql/lint';
import 'codemirror-graphql/info';
import 'codemirror-graphql/jump';
import 'codemirror-graphql/mode';

import { GraphQLSchema } from 'graphql';
import { GraphQLNonNull, GraphQLList, buildSchema } from 'graphql';


export default class GraphQLEditor extends React.Component {

  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    value: PropTypes.string,
    onEdit: PropTypes.func,
    onHintInformationRender: PropTypes.func,
    onClickReference: PropTypes.func,
    onCommand: PropTypes.func,
    editorTheme: PropTypes.string,
    mode: PropTypes.string,
    schemaPrefix: PropTypes.string
  }

  constructor(props) {
    super(props);
    this.cachedValue = props.value || '';
    this._schema = null;
  }

  tryBuildSchema(idl) {
    // TODO: add throttling
    try {
      this._schema = buildSchema(idl);
    } catch(e) {
      // skip error here
    }
  }

  get schema() {
    if (this.props.mode === 'idl') {
      let fullIDL = (this.props.schemaPrefix || '') + '\n' +  this.props.value;
      this.tryBuildSchema(fullIDL);
      return this._schema;
    } else {
      return this.props.schema;
    }
  }

  componentDidMount() {
    this.editor = CodeMirror(this._node, {
      value: this.props.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql',
      theme: this.props.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      foldGutter: {
        minFoldSize: 4
      },
      lint: {
        schema: this.props.schema,
      },
      hintOptions: {
        schema: this.props.schema,
        closeOnUnfocus: false,
        completeSingle: false,
      },
      info: {
        schema: this.props.schema,
        renderDescription: text => marked(text, { sanitize: true }),
        onClick: reference => this.props.onClickReference(reference)
      },
      jump: {
        schema: this.props.schema,
        onClick: reference => this.props.onClickReference(reference),
      },
      gutters: [ 'CodeMirror-linenumbers', 'CodeMirror-foldgutter' ],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({ completeSingle: true }),
        'Ctrl-Space': () => this.editor.showHint({ completeSingle: true }),
        'Alt-Space': () => this.editor.showHint({ completeSingle: true }),
        'Shift-Space': () => this.editor.showHint({ completeSingle: true }),
        'Cmd-Enter': () => {
          if (this.props.onCommand) {
            this.props.onCommand();
          }
        },
        'Ctrl-Enter': () => {
          if (this.props.onCommand) {
            this.props.onCommand();
          }
        },
        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight',
      }
    });

    this.editor.on('change', this._onEdit.bind(this));
    this.editor.on('keyup', this._onKeyUp.bind(this));
    this.editor.on('hasCompletion', this._onHasCompletion.bind(this));
  }

  render() {
    return (
      <div
        className="graphql-editor"
        ref={node => { this._node = node; }}
      />
    );
  }

  componentDidUpdate(prevProps) {
    // Ensure the changes caused by this update are not interpretted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;
    if (this.props.schema !== prevProps.schema) {
      this.updateSchema();
    }
    if (this.props.value !== prevProps.value &&
        (this.props.value !== this.cachedValue)) {
      this.cachedValue = this.props.value;
      this.editor.setValue(this.props.value);
      if (this.props.mode === 'idl') {
        this.updateSchema();
      }
    }
    if (this.props.value !== prevProps.value && this.props.mode === 'idl') {
      this.updateSchema();
    }
    this.ignoreChangeEvent = false;
  }

  updateSchema() {
    this.editor.options.lint.schema = this.schema;
    this.editor.options.hintOptions.schema = this.schema;
    this.editor.options.info.schema = this.schema;
    this.editor.options.jump.schema = this.schema;
    CodeMirror.signal(this.editor, 'change', this.editor);
  }

  componentWillUnmount() {
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  }


  _onKeyUp(cm, event) {
    const code = event.keyCode;
    if (
      (code >= 65 && code <= 90) || // letters
      (!event.shiftKey && code >= 48 && code <= 57) || // numbers
      (event.shiftKey && code === 189) || // underscore
      (event.shiftKey && code === 50) || // @
      (event.shiftKey && code === 57) || // (
      (event.shiftKey && code === 186) // :
    ) {
      this.editor.execCommand('autocomplete');
    }
  }

  _onEdit() {
    if (!this.ignoreChangeEvent) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onEdit) {
        this.props.onEdit(this.cachedValue);
      }
    }
  }

  /**
   * Render a custom UI for CodeMirror's hint which includes additional info
   * about the type and description for the selected context.
   */
  _onHasCompletion (cm, data) {
    onHasCompletion(cm, data);
  }
}


/**
 * Render a custom UI for CodeMirror's hint which includes additional info
 * about the type and description for the selected context.
 */
function onHasCompletion(cm, data, onHintInformationRender) {
  const CodeMirror = require('codemirror');

  let information;
  let deprecation;

  // When a hint result is selected, we augment the UI with information.
  CodeMirror.on(data, 'select', (ctx, el) => {
    // Only the first time (usually when the hint UI is first displayed)
    // do we create the information nodes.
    if (!information) {
      const hintsUl = el.parentNode;

      // This "information" node will contain the additional info about the
      // highlighted typeahead option.
      information = document.createElement('div');
      information.className = 'CodeMirror-hint-information';
      hintsUl.appendChild(information);

      // This "deprecation" node will contain info about deprecated usage.
      deprecation = document.createElement('div');
      deprecation.className = 'CodeMirror-hint-deprecation';
      hintsUl.appendChild(deprecation);

      // When CodeMirror attempts to remove the hint UI, we detect that it was
      // removed and in turn remove the information nodes.
      let onRemoveFn;
      hintsUl.addEventListener('DOMNodeRemoved', onRemoveFn = event => {
        if (event.target === hintsUl) {
          hintsUl.removeEventListener('DOMNodeRemoved', onRemoveFn);
          information = null;
          deprecation = null;
          onRemoveFn = null;
        }
      });
    }

    // Now that the UI has been set up, add info to information.
    const description = ctx.description ?
      marked(ctx.description, { sanitize: true }) :
      'Self descriptive.';
    const type = ctx.type ?
      '<span class="infoType">' + renderType(ctx.type) + '</span>' :
      '';

    information.innerHTML = '<div class="content">' +
      (description.slice(0, 3) === '<p>' ?
        '<p>' + type + description.slice(3) :
        type + description) + '</div>';

    if (ctx.isDeprecated) {
      const reason = ctx.deprecationReason ?
        marked(ctx.deprecationReason, { sanitize: true }) :
        '';
      deprecation.innerHTML =
        '<span class="deprecation-label">Deprecated</span>' +
        reason;
      deprecation.style.display = 'block';
    } else {
      deprecation.style.display = 'none';
    }

    // Additional rendering?
    if (onHintInformationRender) {
      onHintInformationRender(information);
    }
  });
}

function renderType(type) {
  if (type instanceof GraphQLNonNull) {
    return `${renderType(type.ofType)}!`;
  }
  if (type instanceof GraphQLList) {
    return `[${renderType(type.ofType)}]`;
  }
  return `<a class="typeName">${type.name}</a>`;
}
