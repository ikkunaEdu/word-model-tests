const w2v = require('word-models')
const csv = require('csv-escaped-stream')
const remove = [  ]
const stopwords = require('stopwords-iso').en;
const fs = require('fs')

var options = {
    delimiter: '\t',
	// delimiter : ',', // default is ,
	endLine : '\n', // default is \n,
	// columns : ['columnName1', 'columnName2'], // by default read the first line and use values found as columns
	// columnOffset : 2, // default is 0
    // escapeChar : '"', // default is an empty string
    specialChar : String.fromCharCode(92),
    escapedChar : '\t'
	// enclosedChar : '"' // default is an empty string
}

const wordDataFilename = process.argv[2];
const tmpFile = './tmp/output.txt'
const w2vFile = './tmp/w2v.model.txt'
const w2vSchema = './tmp/w2v.model.schema.txt'
const csvStream = csv.createStream;
const readStream = fs.createReadStream;
const writeStream = fs.createWriteStream;
const maximumSchemaSize = 1000000;

var startStream = new readStream(wordDataFilename)
var endStream = new writeStream(tmpFile)

startStream.on('open', () => {
    startStream.pipe(new csvStream(options))
        .on('data header', function(header) {
            console.log('header', header)
        })
        .on('data',function(data){
            // console.log(data)
            const prop = 'Abstract'
            const toWrite = data[prop].split(' ').filter( w => !stopwords.includes(w.toLowerCase()) ).join(' ')
            console.log('toWrite', toWrite)
            endStream.write(toWrite.toLowerCase()+'\n')
        })
        .on('column',function(key,value){
            // outputs the column name associated with the value found
            // console.log('#' + key + ' = ' + value);
            // const str = key == 'name' ? value : '';
        })
        .on('end', () => {
            endStream.close( () => {
                console.log('typeof input', typeof tmpFile)
                console.log('typeof output', typeof w2vFile)
                w2v.word2vec(tmpFile,w2vFile, { minCount: 5 }, (param) => {
                    console.log('model wrote',param)
                    var schemaStream = new writeStream(w2vSchema)
                    var reFactorStream = fs.createReadStream(w2vFile);
                    reFactorStream
                    .pipe(new csvStream(options))
                    .on('header', function(header) {
                        console.log('model header', header)
                        const constructSchema = (size, i,  schemaHeader, tag) => {
                            if (size < 0) console.log('Error in schemaHeader size', size)
                            return size > 1 && size < maximumSchemaSize ? ( () => {
                                return constructSchema(size-1, i+1,schemaHeader.concat(tag+i+'\t'), tag ) 
                            } )() : schemaHeader.concat(tag+i+'\n')
                        }
                        const rawParams = Array.isArray(header) && header.length === 1 && header[0].split(' ').length === 2 ? header[0].split(' ') : ['bad format'];
                        const schemaSize = rawParams.length === 2 ? rawParams[1] : rawParams[0];
                        const schemaHeader = constructSchema(schemaSize, 1, 'word\t', 'modelValue')
                        schemaStream
                        .write(schemaHeader)
                    })
                    .on('data', (data) => {
                        const parseValues = Object.values(data)[0].split(' ')
                        parseValues.splice(-1,1)
                        const toWrite = parseValues.join('\t')
                        // console.log(' data to write ', toWrite )
                        schemaStream
                        .write(toWrite+'\n')
                    })
                    .on('end', () => {
                        console.log('ended')
                    })
                })
                
            })
            console.log('stream ended')
        })
})
.on('error', () => {
    console.error(err);
})