import './css/app.css';
import './css/codemirror.css';
import './GraphQLEditor/editor.css';
import 'graphiql/graphiql.css';

import * as classNames from 'classnames';
import GraphiQL from 'graphiql';
import { Source, GraphQLSchema } from 'graphql';
import { buildWithFakeDefinitions } from '../fake_definition';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import GraphQLEditor from './GraphQLEditor/GraphQLEditor';
import { ConsoleIcon, EditIcon, GithubIcon } from './icons';

type FakeEditorState = {
  value: string | null;
  cachedValue: string | null;
  activeTab: number;
  hasUnsavedChanges: boolean;
  error: string | null;
  status: string | null;
  schema: GraphQLSchema | null;
  unsavedSchema: GraphQLSchema | null;
  remoteSDL: string | null;
};

class FakeEditor extends React.Component<any, FakeEditorState> {
  constructor(props) {
    super(props);

    this.state = {
      value: null,
      cachedValue: null,
      activeTab: 0,
      hasUnsavedChanges: false,
      unsavedSchema: null,
      error: null,
      status: null,
      schema: null,
      remoteSDL: null,
    };
  }

  componentDidMount() {
    this.fetcher('/user-sdl')
      .then((response) => response.json())
      .then((SDLs) => {
        this.updateValue(SDLs);
      });

    window.onbeforeunload = () => {
      if (this.state.hasUnsavedChanges) return 'You have unsaved changes. Exit?';
    };
  }

  fetcher(url, options = {}) {
    const baseUrl = '..';
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
    }).then((response) => response.json());
  }

  updateValue({ userSDL, remoteSDL }) {
    this.setState({
      value: userSDL,
      cachedValue: userSDL,
      remoteSDL,
    });
    this.updateSDL(userSDL, true);
  }

  postSDL(sdl) {
    return this.fetcher('/user-sdl', {
      method: 'post',
      headers: { 'Content-Type': 'text/plain' },
      body: sdl,
    });
  }

  buildSchema(userSDL, options?) {
    if (this.state.remoteSDL) {
      return buildWithFakeDefinitions(
        new Source(this.state.remoteSDL),
        new Source(userSDL),
        options,
      );
    } else {
      return buildWithFakeDefinitions(new Source(userSDL), options);
    }
  }

  updateSDL(value, noError = false) {
    try {
      const schema = this.buildSchema(value);
      this.setState((prevState) => ({
        ...prevState,
        schema,
        error: null,
      }));
      return true;
    } catch (e) {
      if (noError) return;
      this.setState((prevState) => ({ ...prevState, error: e.message }));
      return false;
    }
  }

  setStatus(status, delay) {
    this.setState((prevState) => ({ ...prevState, status: status }));
    if (!delay) return;
    setTimeout(() => {
      this.setState((prevState) => ({ ...prevState, status: null }));
    }, delay);
  }

  saveUserSDL = () => {
    let { value, hasUnsavedChanges } = this.state;
    if (!hasUnsavedChanges) return;

    if (!this.updateSDL(value)) return;

    this.postSDL(value).then((res) => {
      if (res.ok) {
        this.setStatus('Saved!', 2000);
        return this.setState((prevState) => ({
          ...prevState,
          cachedValue: value,
          hasUnsavedChanges: false,
          unsavedSchema: null,
          error: null,
        }));
      } else {
        res.text().then((errorMessage) => {
          return this.setState((prevState) => ({
            ...prevState,
            error: errorMessage,
          }));
        });
      }
    });
  };

  switchTab(tab) {
    this.setState((prevState) => ({ ...prevState, activeTab: tab }));
  }

  onEdit = (val) => {
    if (this.state.error) this.updateSDL(val);
    let unsavedSchema = null as GraphQLSchema | null;
    try {
      unsavedSchema = this.buildSchema(val, { skipValidation: true });
    } catch (_) {}

    this.setState((prevState) => ({
      ...prevState,
      value: val,
      hasUnsavedChanges: val !== this.state.cachedValue,
      unsavedSchema,
    }));
  };

  render() {
    let { value, activeTab, schema, hasUnsavedChanges, unsavedSchema } = this.state;
    if (value == null || schema == null) {
      return <div className="faker-editor-container">Loading...</div>;
    }

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
                '-unsaved': hasUnsavedChanges,
              })}
            >
              {' '}
              <EditIcon />{' '}
            </li>
            <li
              onClick={() => !hasUnsavedChanges && this.switchTab(1)}
              className={classNames({
                '-disabled': hasUnsavedChanges,
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
              schema={unsavedSchema || schema}
              onEdit={this.onEdit}
              onCommand={this.saveUserSDL}
              value={value}
            />
            <div className="action-panel">
              <a
                className={classNames('material-button', {
                  '-disabled': !hasUnsavedChanges,
                })}
                onClick={this.saveUserSDL}
              >
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
              <GraphiQL fetcher={(e) => this.graphQLFetcher(e)} schema={this.state.schema} />
            )}
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<FakeEditor />, document.getElementById('container'));
