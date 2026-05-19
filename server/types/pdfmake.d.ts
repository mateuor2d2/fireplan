declare module 'pdfmake/interfaces' {
  export interface TDocumentDefinitions {
    content?: any[]
    styles?: Record<string, any>
    defaultStyle?: Record<string, any>
    [key: string]: any
  }
}

declare module 'pdfmake/build/pdfmake.js' {
  const pdfMake: any
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts.js' {
  const pdfFonts: any
  export default pdfFonts
}
