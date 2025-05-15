import { writeFileSync } from 'fs'
import {
  GetChannelById,
  GetListByKeyword,
  GetPlaylistData,
  GetSuggestData,
} from '../index'

async function main() {
  let result = await GetListByKeyword('Advanced JavaScript and Modern ES6+')
  writeFileSync('res/search-result.json', JSON.stringify(result, null, 2))

  await new Promise(resolve => setTimeout(resolve, 1000))

  // this is always empty
  let suggestData = await GetSuggestData()
  writeFileSync('res/suggest.json', JSON.stringify(suggestData, null, 2))

  await new Promise(resolve => setTimeout(resolve, 1000))

  let playlist = await GetPlaylistData(
    'RDCLAK5uy_lGZNsVQescoTzcvJkcEhSjpyn_98D4lq0',
  )
  writeFileSync('res/playlist.json', JSON.stringify(playlist, null, 2))

  await new Promise(resolve => setTimeout(resolve, 1000))

  let channel = await GetChannelById('UCj-Xm8j6WBgKY8OG7s9r2vQ')
  writeFileSync('res/channel.json', JSON.stringify(channel, null, 2))
}
main().catch(e => console.error(e))
