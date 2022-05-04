const mongoCLlient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports.connect=(done)=>{
    const url=process.env.ATLAS
    const dbname='shopping'

    mongoCLlient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })

    
}

module.exports.get=()=>{
    return state.db
}