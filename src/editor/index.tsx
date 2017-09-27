import './css/app.css';
import './css/codemirror.css';
import './editor/editor.css';
import 'graphiql/graphiql.css';

import * as classNames from 'classnames';
import * as GraphiQL from 'graphiql';
import { buildSchema, extendSchema, GraphQLSchema, parse } from 'graphql';
import * as fetch from 'isomorphic-fetch';
import * as fakeIDL from 'raw-loader!../fake_definition.graphql';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import GraphQLEditor from './editor/GraphQLEditor';
import { ConsoleIcon, EditIcon, GithubIcon } from './icons';

type FakeEditorState = {
  value: string | null;
  cachedValue: string | null;
  activeTab: number;
  dirty: boolean;
  error: string | null;
  status: string | null;
  schema?: GraphQLSchema;
  extendMode?: boolean;
};

class FakeEditor extends React.Component<any, FakeEditorState> {
  proxiedSchemaIDL: string;

  constructor(props) {
    super(props);

    this.state = {
      value: null,
      cachedValue: null,
      activeTab: 0,
      dirty: false,
      error: null,
      status: null,
      schema: undefined,
    };
  }

  componentDidMount() {
    this.fetcher('/user-idl')
      .then(response => response.json())
      .then(idls => {
        this.updateValue(idls);
      });

    window.onbeforeunload = () => {
      if (this.state.dirty) return 'You have unsaved changes. Exit?';
    };
  }

  fetcher(url, options = {}) {
    const {protocol, host} = window.location;
    const baseUrl = `${protocol}//${host}`;
    return fetch(baseUrl + url, {
      credentials: 'include',
      ...options,
    });
  }

  graphQLFetcher(graphQLParams) {
    return this.fetcher('/graphql', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
    }).then(response => response.json());
  }

  updateValue({ schemaIDL, extensionIDL }) {
    let value = extensionIDL || schemaIDL;
    this.proxiedSchemaIDL = extensionIDL ? schemaIDL : null;
    this.setState({
      value,
      cachedValue: value,
      extendMode: !!extensionIDL,
    });
    this.updateIdl(value, true);
  }

  postIDL(idl) {
    return this.fetcher('/user-idl', {
      method: 'post',
      headers: { 'Content-Type': 'text/plain' },
      body: idl,
    });
  }

  updateIdl(value, noError = false) {
    let extensionIDL;
    let schemaIDL;
    if (this.state.extendMode) {
      extensionIDL = value;
      schemaIDL = this.proxiedSchemaIDL;
    } else {
      schemaIDL = value;
    }
    let fullIdl = schemaIDL + '\n' + fakeIDL;
    try {
      let schema = buildSchema(fullIdl);
      if (extensionIDL) schema = extendSchema(schema, parse(extensionIDL));
      this.setState(prevState => ({
        ...prevState,
        schema: schema,
        error: null,
      }));
      return true;
    } catch (e) {
      if (noError) return;
      this.setState(prevState => ({ ...prevState, error: e.message }));
      return false;
    }
  }

  setStatus(status, delay) {
    this.setState(prevState => ({ ...prevState, status: status }));
    if (!delay) return;
    setTimeout(() => {
      this.setState(prevState => ({ ...prevState, status: null }));
    }, delay);
  }

  saveUserIDL = () => {
    let { value, dirty } = this.state;
    if (!dirty) return;

    if (!this.updateIdl(value)) return;

    this.postIDL(value).then(res => {
      if (res.ok) {
        this.setStatus('Saved!', 2000);
        return this.setState(prevState => ({
          ...prevState,
          cachedValue: value,
          dirty: false,
          error: null,
        }));
      } else {
        res.text().then(errorMessage => {
          return this.setState(prevState => ({
            ...prevState,
            error: errorMessage,
          }));
        });
      }
    });
  };

  switchTab(tab) {
    this.setState(prevState => ({ ...prevState, activeTab: tab }));
  }

  onEdit = val => {
    if (this.state.error) this.updateIdl(val);
    this.setState(prevState => ({
      ...prevState,
      value: val,
      dirty: val !== this.state.cachedValue,
    }));
  };

  render() {
    let { value, activeTab, dirty, extendMode } = this.state;
    let prefixIDL = fakeIDL + (this.proxiedSchemaIDL || '');
    return (
      <div className="faker-editor-container">
        <nav>
          <div className="logo">
            <a href="https://github.com/APIs-guru/graphql-faker" target="_blank">
              {' '}
              <img src="./logo.svg" />{' '}
            </a>
          </div>
          <ul>
            <li
              onClick={() => this.switchTab(0)}
              className={classNames({
                '-active': activeTab === 0,
                '-dirty': dirty,
              })}
            >
              {' '}
              <EditIcon />{' '}
            </li>
            <li
              onClick={() => this.state.schema && this.switchTab(1)}
              className={classNames({
                '-disabled': !this.state.schema,
                '-active': activeTab === 1,
              })}
            >
              {' '}
              <ConsoleIcon />{' '}
            </li>
            <li className="-pulldown -link">
              <a href="https://github.com/APIs-guru/graphql-faker" target="_blank">
                {' '}
                <GithubIcon />{' '}
              </a>
            </li>
          </ul>
        </nav>
        <div className="tabs-container">
          <div
            className={classNames('tab-content', 'editor-container', {
              '-active': activeTab === 0,
            })}
          >
            <GraphQLEditor
              schemaPrefix={prefixIDL}
              extendMode={!!extendMode}
              onEdit={this.onEdit}
              onCommand={this.saveUserIDL}
              value={value || ''}
            />
            <div className="action-panel">
              <a
                className={classNames("material-button", {
                  '-disabled': !dirty,
                })}
                onClick={this.saveUserIDL}>
                <span> Save </span>
              </a>
              <div className="status-bar">
                <span className="status"> {this.state.status} </span>
                <span className="error-message">{this.state.error}</span>
              </div>
            </div>
          </div>
          <div
            className={classNames('tab-content', {
              '-active': activeTab === 1,
            })}
          >
            {this.state.schema && (
              <GraphiQL fetcher={e => this.graphQLFetcher(e)} schema={this.state.schema} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<FakeEditor />, document.getElementById('container'));
