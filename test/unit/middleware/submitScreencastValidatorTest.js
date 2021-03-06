// @flow

import sinon from 'sinon'
import {expect} from 'chai'
import proxyquire from 'proxyquire'
import httpMocks from 'node-mocks-http'
import {describe, it} from 'mocha'

describe('submitScreencastValidator', () => {
  it('invokes next middleware when req.body is valid', async () => {
    const sequelizeConnectMock = {
      models: {
        screencast: {
          findOne: async () => null
        }
      }
    }
    const youtubeMock = {
      create: () => ({
        videoExists: () => true
      })
    }
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'https://www.youtube.com/watch?v=correctly_formatted_youtube_url',
        tags: 'tag1, tag2'
      }
    })
    const resMock = httpMocks.createResponse()
    const nextSpy = sinon.spy()
    const {validateSubmitScreencastReq} = proxyquire('../../../source/middleware/submitScreencastValidator.js', {
      'sequelize-connect': sequelizeConnectMock,
      '../../source/util/youtubeClient': youtubeMock
    })

    await validateSubmitScreencastReq(reqMock, resMock, nextSpy)

    expect(nextSpy.called).to.be.true
  })

  it('returns 400 when req.body is totally invalid', async () => {
    const reqMock = httpMocks.createRequest()
    const resMock = httpMocks.createResponse()
    const {validateSubmitScreencastReq} = require('../../../source/middleware/submitScreencastValidator.js')

    await validateSubmitScreencastReq(reqMock, resMock)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'url',
      message: 'url cannot be undefined'
    }, {
      field: 'tags',
      message: 'tags cannot be undefined'
    }])
  })

  it('returns 400 when "url" isn\'t a correctly formatted YouTube URL', async () => {
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'invalid URL',
        tags: 'tag1, tag2'
      }
    })
    const resMock = httpMocks.createResponse()
    const {validateSubmitScreencastReq} = require('../../../source/middleware/submitScreencastValidator.js')

    await validateSubmitScreencastReq(reqMock, resMock)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'url',
      message: 'url must be a valid YouTube URL'
    }])
  })

  it('returns 400 when "tags" isn\'t a string', async () => {
    const sequelizeConnectMock = {
      models: {
        screencast: {
          findOne: async () => null
        }
      }
    }
    const youtubeMock = {
      create: () => ({
        videoExists: () => true
      })
    }
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'https://www.youtube.com/watch?v=qsDvJrGMSUY',
        tags: ['tag1', 'tag2']
      }
    })
    const resMock = httpMocks.createResponse()
    const {validateSubmitScreencastReq} = proxyquire('../../../source/middleware/submitScreencastValidator.js', {
      'sequelize-connect': sequelizeConnectMock,
      '../../source/util/youtubeClient': youtubeMock
    })

    await validateSubmitScreencastReq(reqMock, resMock)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'tags',
      message: 'tags must be a string'
    }])
  })

  it('returu 400 when "tags" is undefined', async () => {
    const sequelizeConnectMock = {
      models: {
        screencast: {
          findOne: async () => null
        }
      }
    }
    const youtubeMock = {
      create: () => ({
        videoExists: () => true
      })
    }
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'https://www.youtube.com/watch?v=qsDvJrGMSUY'
      }
    })
    const resMock = httpMocks.createResponse()
    const {validateSubmitScreencastReq} = proxyquire('../../../source/middleware/submitScreencastValidator.js', {
      'sequelize-connect': sequelizeConnectMock,
      '../../source/util/youtubeClient': youtubeMock
    })

    await validateSubmitScreencastReq(reqMock, resMock)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'tags',
      message: 'tags cannot be undefined'
    }])
  })

  it('returns 400 when "url" is undefined', async () => {
    const reqMock = httpMocks.createRequest({
      body: {
        tags: 'tags'
      }
    })
    const resMock = httpMocks.createResponse()
    const {validateSubmitScreencastReq} = require('../../../source/middleware/submitScreencastValidator.js')

    await validateSubmitScreencastReq(reqMock, resMock)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'url',
      message: 'url cannot be undefined'
    }])
  })

  it('returns 400 when "url" links to a non-existent YouTube video', async () => {
    const youtubeMock = {
      create: () => ({
        videoExists: () => false
      })
    }
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'https://www.youtube.com/watch?v=doesnotexist',
        tags: 'tags'
      }
    })
    const resMock = httpMocks.createResponse()
    const nextSpyDummy = function () {}
    const {validateSubmitScreencastReq} = proxyquire('../../../source/middleware/submitScreencastValidator.js', {
      '../../source/util/youtubeClient': youtubeMock
    })

    await validateSubmitScreencastReq(reqMock, resMock, nextSpyDummy)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'url',
      message: 'url must link to an existent, public YouTube video'
    }])
  })

  it('returns 400 when "url" has already been submitted', async () => {
    const sequelizeConnectMock = {
      models: {
        screencast: {
          findOne: async () => ({})
        }
      }
    }
    const youtubeMock = {
      create: () => ({
        videoExists: () => true
      })
    }
    const reqMock = httpMocks.createRequest({
      body: {
        url: 'https://www.youtube.com/watch?v=doesnotexist',
        tags: 'tags'
      }
    })
    const resMock = httpMocks.createResponse()
    const nextDummy = function () {}
    const {validateSubmitScreencastReq} = proxyquire('../../../source/middleware/submitScreencastValidator.js', {
      'sequelize-connect': sequelizeConnectMock,
      '../../source/util/youtubeClient': youtubeMock
    })

    await validateSubmitScreencastReq(reqMock, resMock, nextDummy)

    expect(resMock.statusCode).to.equal(400)
    const {errors} = JSON.parse(resMock._getData())
    expect(errors).to.deep.equal([{
      field: 'url',
      message: 'url has already been submitted'
    }])
  })
})
