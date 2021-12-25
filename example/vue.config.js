module.exports = {
  pages: {
    window1: {
      // page 的入口
      entry: 'src/entry/window1.ts',
      // 模板来源
      template: 'public/index.html',
      // 窗口 1
      filename: 'window1.html'
    },
    window2: {
      // page 的入口
      entry: 'src/entry/window2.ts',
      // 模板来源
      template: 'public/index.html',
      // 窗口 1
      filename: 'window2.html'
    }
  },

  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  }
}
