import request from 'superagent'
import { moveArrayBack, moveArrayAhead } from '../utils'
import { findKey, get, mapValues, isArray, isPlainObject, without } from 'lodash'

// Hight value for pagination that means no limit maaan
const NO_LIMIT = 1000

// Inject token in Authorization header when provided
export const withToken = (token, baseRequest) =>
  (token ? baseRequest.set('Authorization', `Bearer ${token}`) : baseRequest)

// Extract only body from response, when other stuff like response
// headers and so on are useless
export const extractBody = ({ body }) => body

// Return a chapter \w data.count_modules ....
const countChapterModules = chapter => {
  return {
    ...chapter,
    data: {
      ...chapter.data,
      count_modules: get(chapter, 'contents.modules.length', 0),
    }
  }
}

// Prepare story for server...
const prepareStory = story => {
  let storyForServer = { ...story }

  // Empty background image fields...
  if (storyForServer.backgroundType === 'color') {
    storyForServer = {
      ...storyForServer,
      data: {
        ...storyForServer.data,
        background: {
          ...storyForServer.data.background,
          overlay: '',
        }
      },
      covers: []
    }
  }

  return storyForServer
}

// Build params for shitty miller
const buildMillerParams = (params) => {
  let newParams = params

  if (newParams.filters && typeof newParams.filters !== 'string') {
    newParams = { ...newParams, filters: JSON.stringify(newParams.filters) }
  }

  if (newParams.exclude && typeof newParams.exclude !== 'string') {
    newParams = { ...newParams, exclude: JSON.stringify(newParams.exclude) }
  }

  return newParams
}

export const me = token =>
  withToken(token, request.get('/api/profile/me/'))
    .then(extractBody)

const CLIENT_ID = 'b7X9djWuMXK5WZBCNINieUFyQfnFkIPqgf3MsaN5'
const oauth = grantType =>
  request.post(`/editor/o/token/`).type('form').send({
    client_id: CLIENT_ID,
    grant_type: grantType,
  })

export const login = ({ username, password }) =>
  oauth('password')
    .send({ username, password })
    .then(extractBody)

export const refreshToken = token =>
  oauth('refresh_token')
    .send({ refresh_token: token })
    .then(extractBody)

export const getDocuments = token => (params = {}) =>
  withToken(
    token,
    request
      .get(`/api/document/`)
      .query(buildMillerParams(params))
  )
  .then(extractBody)

// Stories

export const getStories = token => (params = {}) =>
  withToken(token, request.get('/api/story/').query({
    limit: NO_LIMIT,
    orderby: 'priority',
    ...params,
  }))
  .then(extractBody)

export const getStory = token => id =>
  withToken(token, request.get(`/api/story/${id}/`).query({
    nocache: true,
    parser: 'yaml',
  }))
  .then(extractBody)

export const updateStoryStatus = token => (id, status) =>
  withToken(token,request.patch(`/api/story/${id}/`)
    .send({ status })
  )
  .then(extractBody)

export const getThemes = token => () =>
  getStories(token)({
    filters: JSON.stringify({
      'tags__slug': 'theme',
    }),
    orderby: 'priority',
  })

export const getStaticStories = token => () =>
  getStories(token)({
    filters: JSON.stringify({
      'tags__slug': 'static',
    }),
  })

export const getEducationals = token => () =>
  getStories(token)({
    filters: JSON.stringify({
      'tags__slug': 'education',
    }),
    orderby: 'priority',
  })

export const deleteStory = token => id =>
  withToken(token, request.del(`/api/story/${id}/`))
    .then(extractBody)

export const updateStaticStory = token => story => {
  return withToken(
    token,
    request.patch(`/api/story/${story.id}/`)
      .send({
        data: story.data,
      })
  )
  .then(extractBody)
}

export const updateStory = token => story => {
  const storyToUpdate = prepareStory(story)
  return withToken(
    token,
    request.patch(`/api/story/${story.id}/`)
      .send({
        covers: storyToUpdate.covers.map(({ id }) => id),
        data: storyToUpdate.data,
      })
  )
  .then(extractBody)
}

export const updateChapter = token => (chapter, languages = []) => {
  return updateStory(token)(countChapterModules(chapter), languages)
}

export const createStory = token => (story, languages = []) => {
  const storyToCreate = prepareStory(story)
  return withToken(
    token,
    request.post(`/api/story/`)
      .send({
        // First non empty in lang title
        // TODO: What if empty?????
        ...storyToCreate,
        title: storyToCreate.data.title[findKey(storyToCreate.data.title)],
        covers: storyToCreate.covers.map(({ id }) => id),
      })
  )
  .then(extractBody)
}

export const createChapter = token => (chapter, languages = []) => {
  return createStory(token)(countChapterModules(chapter), languages)
}

export const mentionStory = token => (fromStory, toStory) =>
  withToken(
    token,
    request.post(`/api/mention/`)
      .send({
        to_story: toStory,
        from_story: fromStory,
      })
  )
  .then(extractBody)

// FIXME TODO temporany workaround for not encoded json
const smartParseIntoJsonWhenReallyNeeded = data =>
  (typeof data !== 'string' || data === '') ? data : JSON.parse(data)
const reParse = data => ({
  ...data,
  data: smartParseIntoJsonWhenReallyNeeded(data.data),
  contents: smartParseIntoJsonWhenReallyNeeded(data.contents),
})

const onlyId = module => mapValues(module, (v, k, o) => {
  if (isPlainObject(v)) {
    if (k === 'id' && typeof v.id !== 'undefined') {
      return v.id
    }
    return onlyId(v)
  }
  if (isArray(v)) {
    return v.map((e, i) => {
      if (isPlainObject(e)) {
        return onlyId(e)
      }
      return e
    })
  }
  return v
})

export const createStoryCaptions = token => storyId =>
  withToken(token, request.post(`/api/caption/extract-from-story/${storyId}/`).send({
    key: 'id',
    parser: 'json',
  }))
  .then(extractBody)

export const createChapterCaptions = token => chapterId =>
  createStoryCaptions(token)(chapterId)

export const createModuleChapter = token => (chapter, module) =>
  withToken(token, request.patch(`/api/story/${chapter.id}/`).send({
    data: {
      ...chapter.data,
      count_modules: get(chapter, 'contents.modules.length', 0) + 1,
    },
    contents: JSON.stringify({
      modules: get(chapter, 'contents.modules', []).concat(onlyId(module))
    })
  }))
  .then(extractBody)

export const createEducational = token => edu =>
  withToken(token, request.post(`/api/story/`).send({
    ...edu,
    title: edu.data.title[findKey(edu.data.title)],
    contents: JSON.stringify(onlyId(edu.contents)),
    covers: edu.covers.map(({ id }) => id),
  }))
  .then(extractBody)

export const updateEducational = token => edu =>
  withToken(token, request.patch(`/api/story/${edu.id}/`).send({
    data: edu.data,
    covers: edu.covers.map(({ id }) => id),
    contents: JSON.stringify(onlyId(edu.contents)),
  }))
  .then(extractBody)

export const deleteModuleChapter = token => (chapter, moduleIndex) =>
  withToken(token, request.patch(`/api/story/${chapter.id}/`).send({
    data: {
      ...chapter.data,
      count_modules: get(chapter, 'contents.modules.length', 1) - 1,
    },
    contents: JSON.stringify({
      modules: get(chapter, 'contents.modules', []).filter((m, i) =>
        i !== moduleIndex
      )
    })
  }))
  .then(extractBody)

export const moveModuleChapterAhead = token => (chapter, moduleIndex) =>
  withToken(token, request.patch(`/api/story/${chapter.id}/`).send({
    contents: JSON.stringify({
      modules: moveArrayAhead(get(chapter, 'contents.modules', []), moduleIndex)
    })
  }))
  .then(extractBody)

export const moveModuleChapterBack = token => (chapter, moduleIndex) =>
  withToken(token, request.patch(`/api/story/${chapter.id}/`).send({
    contents: JSON.stringify({
      modules: moveArrayBack(get(chapter, 'contents.modules', []), moduleIndex)
    })
  }))
  .then(extractBody)

export const moveChapterThemeAhead = token => (theme, chapterIndex) =>
  withToken(token, request.patch(`/api/story/${theme.id}/`).send({
    data: {
      ...theme.data,
      chapters: moveArrayAhead(theme.data.chapters, chapterIndex)
    }
  }))
  .then(extractBody)

export const moveChapterThemeBack = token => (theme, chapterIndex) =>
  withToken(token, request.patch(`/api/story/${theme.id}/`).send({
    data: {
      ...theme.data,
      chapters: moveArrayBack(theme.data.chapters, chapterIndex)
    }
  }))
  .then(extractBody)

export const moveStoryAhead = token => (storiesIds, index) => {
  const orderedIds = moveArrayAhead(storiesIds, index).reverse().join(',')
  return withToken(token, request.post(`/api/story/priority/${orderedIds}/`))
    .then(extractBody)
    .then(data => ({ ...data, ids: data.ids.reverse() }))
}

export const moveStoryBack = token => (storiesIds, index) => {
  const orderedIds = moveArrayBack(storiesIds, index).reverse().join(',')
  return withToken(token, request.post(`/api/story/priority/${orderedIds}/`))
    .then(extractBody)
    .then(data => ({ ...data, ids: data.ids.reverse() }))
}

export const addChapterToTheme = token => (theme, chapterId) =>
  withToken(token, request.patch(`/api/story/${theme.id}/`).send({
    data: {
      ...theme.data,
      chapters: theme.data.chapters.concat(chapterId)
    }
  }))
  .then(extractBody)

export const removeChapterFromTheme = token => (theme, chapterId) =>
  withToken(token, request.patch(`/api/story/${theme.id}/`).send({
    data: {
      ...theme.data,
      chapters: without(theme.data.chapters, chapterId),
    }
  }))
  .then(extractBody)

export const updateModuleChapter = token => (chapter, module, index) =>
  withToken(token, request.patch(`/api/story/${chapter.id}/`).send({
    contents: JSON.stringify({
      modules: get(chapter, 'contents.modules', []).map((m, i) => {
        if (i === (index - 1)) {
          return onlyId(module)
        }
        return m
      })
    })
  }))
  .then(extractBody)
