import { getClassNameForMimeType, getClassNameForFilename } from 'font-awesome-filetypes'

import { renderHTML } from './render/htmlWrapper'
import { renderPath } from './render/pathUtil'
import { renderMarkdown } from './render/mdRenderer'

/**
 * Convert bytes to human readable file size
 *
 * @param {Number} bytes File size in bytes
 * @param {Boolean} si 1000 - true; 1024 - false
 */
function readableFileSize(bytes, si) {
  bytes = parseInt(bytes, 10)
  var thresh = si ? 1000 : 1024
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B'
  }
  var units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  var u = -1
  do {
    bytes /= thresh
    ++u
  } while (Math.abs(bytes) >= thresh && u < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[u]
}

/**
 * Render Folder Index
 *
 * @param {*} items
 * @param {*} isIndex don't show ".." on index page.
 */
export async function renderFolderView(items, path) {
  const isIndex = path === '/'

  const el = (tag, attrs, content) => `<${tag} ${attrs.join(' ')}>${content}</${tag}>`
  const div = (className, content) => el('div', [`class=${className}`], content)
  const item = (icon, fileName, fileAbsoluteUrl, size) =>
    el(
      'a',
      [`href="${fileAbsoluteUrl}"`, 'class="item"', size ? `size="${size}"` : ''],
      el('i', [`class="${icon}"`], '') +
        fileName +
        el('div', ['style="flex-grow: 1;"'], '') +
        (fileName === '..' ? '' : el('span', ['class="size"'], readableFileSize(size)))
    )

  const intro = `<div class="intro markdown-body" style="text-align: left; margin-top: 2rem;">
                    <h2>🍻 beet's onedrive index</h2>
		    <p>Thanks: <a href="https://github.com/spencerwooo/onedrive-cf-index">onedrive-cf-index</a></p>
		    <p style="color: #F56476">Also make od CN(世纪互联) possible in <a href="https://github.com/beetcb/onedrive-cf-index">onedrive-cf-index-CN</a>
                  </div>`

  // Check if current directory contains README.md, if true, then render spinner
  let readmeExists = false
  let readmeFetchUrl = ''

  const body = div(
    'container',
    div('path', renderPath(path)) +
      div(
        'items',
        el(
          'div',
          ['style="min-width: 600px"'],
          (!isIndex ? item('far fa-folder', '..', `${path}..`) : '') +
            items
              .map(i => {
                if ('folder' in i) {
                  return item('far fa-folder', i.name, `${path}${i.name}/`, i.size)
                } else if ('file' in i) {
                  // Check if README.md exists
                  if (!readmeExists) {
                    readmeExists = i.name.toLowerCase() === 'readme.md'
                    readmeFetchUrl = i['@microsoft.graph.downloadUrl']
                  }

                  // Render file icons
                  let fileIcon = getClassNameForMimeType(i.file.mimeType)
                  if (fileIcon === 'fa-file') {
                    if (i.name.split('.').pop() === 'md') {
                      fileIcon = 'fab fa-markdown'
                    } else {
                      fileIcon = `far ${getClassNameForFilename(i.name)}`
                    }
                  } else {
                    fileIcon = `far ${fileIcon}`
                  }
                  return item(fileIcon, i.name, `${path}${i.name}`, i.size)
                } else {
                  console.log(`unknown item type ${i}`)
                }
              })
              .join('')
        )
      ) +
      (readmeExists && !isIndex ? await renderMarkdown(readmeFetchUrl, 'fade-in-fwd', '') : '') +
      (isIndex ? intro : '')
  )
  return renderHTML(body)
}
