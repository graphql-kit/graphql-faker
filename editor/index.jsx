import React from 'react';
import ReactDOM from 'react-dom';

import { buildSchema } from 'graphql';

import fakeIDL from 'raw-loader!../fake_definition.graphql';
import GraphQLEditor from './editor/GraphQLEditor';

import fetch from 'isomorphic-fetch';

const fakeSchema = buildSchema(fakeIDL + ' schema { query: QueryType } type QueryType { a: String }');

class FakeEditor extends React.Component {
  constructor() {
    super();

    this.state = {
      value: null
    }
  }

  componentDidMount() {
    fetch('/user-idl')
      .then(response => response.text())
      .then(text => {
        this.updateValue(text);
      });
  }

  updateValue(userIDL) {
    this.setState({
      value: userIDL
    });
  }

  render() {
    return (
      <div class="faker-editor-container">
        <GraphQLEditor schema={fakeSchema} value={this.state.value}/>
      </div>
    )
  }
}

ReactDOM.render(<FakeEditor />, document.getElementById('container'));
