var fs = require('fs');
var path = require('path');
var async = require('async');

/*
  Accepts a fileName as string
  Returns an object with the file name and detected extension
*/
checkExtension = function(fileName){
  var fileObj = {};
  if(!fileName) return fileObj;
  var length = fileName.length;
  var lastDot = fileName.lastIndexOf('.');
  var spaces = length - lastDot;
  console.log('\n\n\nLast DOT detected ' , spaces, ' spaces before the end of the string : ', fileName);
  if(spaces > 5) return fileObj;
  var exts = fileName.substring(length - spaces);
  fileName = fileName.substring(0, length - spaces);
  fileObj = {fileName, extension: exts};
  console.log('\n\n\nEXTENSION OBJECT : ', fileObj);
  return fileObj;
}

htmlFolderfy = function(allFiles){
  console.log('\n\nFolderFY : ', allFiles);
  var allFilesLIST = '<ul>';
  allFiles.forEach((file)=>{
    var fLength = -1;
    try {
      var folderList = file.split(',');
      fLength = folderList.length;
    } catch (e) {
      fLength = -1;
    }
    if(fLength > -1) allFilesLIST = allFilesLIST + '<li>' + file + '</li>';
    else allFilesLIST = allFilesLIST + '<li>' + file + '</li>';
  });
  return allFilesLIST = allFilesLIST + '</ul>';
}

listAllFiles = function(pathName){
  var allFiles = [];
  if(!fs.lstatSync(pathName).isDirectory()) allFiles.push(pathName);
  else{
    console.log('\nlistAllFiles()----------------------------------- : ', pathName, '\n');
    console.log('\nlistAllFiles()----------------------------------- : ', pathName, '\n');
    allFiles.push('\n[DIRECTORY] - ' + pathName);
    fs.readdirSync(pathName).forEach((fileInDir)=>{
      var fileU = path.join(pathName, '/', fileInDir);
      console.log('\n\nself-call listAllFiles(', fileU, ')');
      allFiles.push(listAllFiles(fileU));
    });
  }
  return allFiles;
}

/*
  CLEAR A DIRECTORY, but keep the directory folder in the project
    recursively call the deleteDirectory Method on each subfolder in the directory.
*/
clearDirectory = function(pathName){
  if(fs.lstatSync(pathName).isDirectory()){
    var files = fs.readdirSync(pathName);
    async.eachSeries(files, function(param, callback){
      console.log('\n\nfiles in series : ', files.length);
      var subdirLength = files.length - 1;
      files.forEach((f, indi)=>{
        // console.log('file #' + indi + ' : ', f);
        var filePath = path.join(pathName, '/', f);
        if(fs.lstatSync(filePath).isDirectory()) deleteDirectory(filePath);
        else fs.unlinkSync(filePath);
      });
      console.log('\nFINISH DIRECTORY : ', pathName);
    }, function(err){
      console.log('\n\nERR', err);
    });
  }
}

zipFolder = function(folderDirectory, callback){
  console.log('\n\n--------------------------------------init Zip Folder! : \n', folderDirectory);
  var archiver = require('archiver');
  var outZip = fs.createWriteStream(folderDirectory+'.zip');
  var zip = archiver('zip');

  outZip.on('close', function(){
    console.log('\n\n------------------ ZIPPED FOLDER CLOSED ------------------ \n');
    console.log('\t\ttotal bytes = ', zip.pointer());
    return callback(folderDirectory + '.zip');
  });
  zip.on('end', function() {
    console.log('\n------------------ ZIPPED Data has been drained ------------------ \n');
    // return callback(folderDirectory + '.zip');
  });

  zip.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.log('\n\n\n****************************************************************');
      console.log('ENOENT (WARNING) zipping file : ', err);
      console.log('****************************************************************\n\n\n');
    } else {throw err;}
  });
  zip.on('error', function(err) {
    console.log('\n\n\n****************************************************************');
    console.log('ERROR zipping file : ', err);
    console.log('****************************************************************\n\n\n');
    throw err;
  });

  zip.pipe(outZip);
  // zip.bulk() is DEPRECRATED --> use zip.directory()
  // zip.bulk([
  //   {expand: true, cwd: 'source', src: ['**'], dest: 'source'}
  // ]);
  zip.directory(folderDirectory, false);
  zip.finalize();
  console.log('\n\n-------------------------------------- ZIP FOLDER FINALIZED() --------------------------------------\n\n');
   /*
    -------> NEED to wait for the zip file to "close" before the client can trigger download
    return folderDirectory + '.zip'; \
  */
}

zipAllFiles = function(folderDirectory, callback){
  console.log('\n\n--------------------------------------init Zip Folder! : \n', folderDirectory);
  var archiver = require('archiver');
  var zip = archiver('zip');


  zip.on('end', function() {
    console.log('\n------------------ ZIPPED Data has been drained ------------------ \n');
    // return callback(folderDirectory + '.zip');
  });

  zip.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.log('\n\n\n****************************************************************');
      console.log('ENOENT (WARNING) zipping file : ', err);
      console.log('****************************************************************\n\n\n');
    } else {throw err;}
  });
  zip.on('error', function(err) {
    console.log('\n\n\n****************************************************************');
    console.log('ERROR zipping file : ', err);
    console.log('****************************************************************\n\n\n');
    throw err;
  });

  //INSTEAD OF directory(), append() each file
  // zip.directory(folderDirectory, false);

  var files = fs.readdirSync(folderDirectory);
  files.forEach((file, x)=>{
    var x = x+1;
    console.log('.append() \t#'+ x + ' : ', file);
    var fileP = path.join(folderDirectory, '/', file);
    zip.append(fs.createReadStream(fileP), {name:file});
  });

  var outZip = fs.createWriteStream(folderDirectory+'.zip');
  outZip.on('close', function(){
    console.log('\n\n------------------ ZIPPED FOLDER CLOSED ------------------ \n');
    console.log('\t\ttotal bytes = ', zip.pointer());
    return callback(folderDirectory + '.zip');
  });

  zip.finalize();
  console.log('\n\n-------------------------------------- ZIP FOLDER FINALIZED() --------------------------------------\n\n');
  zip.pipe(outZip);
  // track when file is completed

   /*
    -------> NEED to wait for the zip file to "close" before the client can trigger download
    return folderDirectory + '.zip'; \
  */
}

/*
  Delete all files in a Directory
  Recursively call the deleteDirectory() method on subdirectories until all are cleared
*/
deleteDirectory = function(pathName){
  console.log('\n\n\n\n--------------------------------------------------------\nDELETE DIRECTORY : ', pathName);
  if(!fs.existsSync(pathName)) return pathName;
  if(!fs.lstatSync(pathName)) return pathName;
  if(fs.lstatSync(pathName).isDirectory()){
    console.log('\nis directory');
    var files = fs.readdirSync(pathName);

    if(files.length === 0){
      fs.rmdirSync(pathName);
      console.log('\n\nFINISHED DIRECTORY DELETE');
      return true;
    }else{
      async.eachSeries(files, function(param, callback){
        console.log('\n\nfiles in series : ', files.length);
        var subdirLength = files.length - 1;
        files.forEach((f, indi)=>{
          // console.log('file #' + indi + ' : ', f);
          var filePath = path.join(pathName, '/', f);
          if(fs.lstatSync(filePath).isDirectory()) deleteDirectory(filePath);
          else fs.unlinkSync(filePath);
          if(subdirLength === indi){
            if(fs.readdirSync(pathName).length < 1){
              try {
                fs.rmdirSync(pathName);
              } catch (e) {
                setTimeout(function(){
                  if(fs.readdirSync(pathName).length < 1){
                    fs.rmdirSync(pathName);
                  };
                }, 10000);
              }
            }else{
              setTimeout(function(){
                if(fs.readdirSync(pathName).length < 1){
                  fs.rmdirSync(pathName);
                };
              }, 10000);
            }
          }
        });
        console.log('\nFINISH DIRECTORY : ', pathName);
      }, function(err){
        console.log('\n\nERR', err);
        if(!err) console.log(pathName, '\n\t', files);
      });
    }
  }else{
    console.log('\nis NOT directory');
  }
};

/*
  RECURSIVELY DELETE a directory + subdirectory + folders
*/
deleteDirectory2 = function(pathName){
  console.log('\n\n*************************************************************\nDELETE DIRECTORY : ', pathName);
  // if(pathName.indexOf('downloads\\batchdownload')=== -1 && pathName.indexOf('downloads/batchdownload')=== -1) return false;
  if(pathName.indexOf('downloads\\')=== -1 && pathName.indexOf('downloads/')=== -1) return false;
  if(fs.existsSync(pathName)){
    if(fs.lstatSync(pathName).isDirectory()){
      console.log('valid directory name!');
      var files = fs.readdirSync(pathName);
      files.forEach((file)=>{
        var fName = path.join(pathName, file);
        if(fs.lstatSync(fName).isDirectory()) deleteDirectory(fName);
        else deleteFile(fName);
      });
    }
    console.log('\n\nall files deleted!');
    var valid = false;
    try {
      if(fs.readdirSync(pathName).length === 0) fs.rmdirSync(pathName);
      else{
        setTimeout(function(){
          // fs.rmdirSync(pathName);
          deleteDirectory(pathName)
          valid = true;
          console.log('\n\ndirectory deleted!');
        }, 1000);
      }
    } catch (e) {
      console.log('\n\n*********************************************************');
      console.log('\nPATHNAME ERROR --> ', pathName);
      console.log('Directory cannot be deleted\nERROR ::::: ', e);
      console.log('\n\n*********************************************************');
      valid = false;
    }
    return valid;
  }
  return false;
}

deleteFile = function(pathName){
  console.log('DELETE File : ', pathName);
  if(pathName.indexOf('download-')=== -1) return false;
  if(fs.existsSync(pathName)){
    fs.unlinkSync(pathName);
    console.log('file deleted!');
    return true;
  }
  return false;
}
