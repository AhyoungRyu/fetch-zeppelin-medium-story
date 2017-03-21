var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 3
  }
)

var Feed = require('rss-to-json-extends')
var Promise = require('bluebird')
var jsonFormat = require('json-format')

const storyUri = 'https://medium.com/feed/apache-zeppelin-stories/'
Feed = Promise.promisifyAll(Feed)

exports.handler = (event, context, callback) => {
  Feed.loadAsync(storyUri)
    .then(function (rss) {
      var config = {
        type: 'space',
        size: 2
      }
      var result = jsonFormat(rss, config)

      return result
    })
    .then(function (result) {
      const bucketName = 'apache-zeppelin'
      const folderName = 'post/'
      var fakeJsBody = 'var mediumPost = [' + result + ']'

      var content = {
        Bucket: bucketName,
        Key: folderName + 'medium.js',
        Body: fakeJsBody,
        ACL: 'public-read'
      }

      var putObjectPromise = s3.putObject(content).promise()

      putObjectPromise
        .then(function (data) {
          console.log(data)
        })
        .then(function () {
          return context.callbackWaitsForEmptyEventLoop = false
        })
        .then(function () {
          return callback(null, "Done")
        })
    })
    .catch(function (error) {
      console.error(error.message)
    })
}