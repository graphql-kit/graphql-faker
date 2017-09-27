declare module 'raw-loader!*' {
  var content: string;
  export = content;
}

declare module '*.css' {
  var content: any;
  export = content;
}
