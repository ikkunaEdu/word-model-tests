const w2v = require('word-models')

const w2vFile = './tmp/w2v.model.txt'

const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
    }))
  }

w2v.loadModel( w2vFile, async function( error, model ) {
    const near = (w) =>  model.getNearestWords(model.getVector(w), 15)
    const lognear = (w) => console.log('nearest to',w,near(w) )
    console.log( model );
    if (error) console.log(error)
    const wordA = 'recurrent';
    const wordB = 'convolution';
    const analogyWordA = 'matrix';
    const analogyWordB = 'learning'
    const distance = model.similarity( wordA, wordB );
    const nearestA = model.getNearestWords(model.getVector(analogyWordA), 15)
    const nearestB = model.getNearestWords(model.getVector(analogyWordB), 15)
    console.log('distance', distance)
    lognear(analogyWordA)
    await keypress()
    lognear(analogyWordB)
    lognear(wordA)
    lognear(wordB)
    lognear('complex')
    lognear('neurons')
    lognear('inference')
    lognear('random')
});