 //"C:\\Program Files (x86)\\Connect\\Connect.exe";

 const fs = require('fs');
 const path = require("path");


 var executer =  "python" 
 var File_ = "unzip.py"

  var ConnectProcs = {};
 
  var Filecntr = 7
  var totalFiles  = 8
  const MAX_PROCESS = 10
  var outputPath = '/lustre/alice3/data/neuroretinal/ukb_master/OCT_RE/'
  var ZippedPath = '/lustre/alice3/data/neuroretinal/ukb_master/OCT_RE/zip/'


  var ZipFileName = "dir_"
  var gTimerHndl = 0

class Queue {

  constructor() { this.q = []; }
  size() { return this.q.length; }
  send( item )  { this.q.push( item ); }
  receive()     { return this.q.shift(); }
  exist(item)     { return this.q.includes(item); }
}

const zip_Unzip_queue = new Queue();


 function SendMessage(message , pid)
 {
   try
   {
      CheckIfProcessExist(pid , (Livestatus) =>
      {
        if(Livestatus)
        {
          console.log("SendMessage to Connect app - Start.....")
          let Send_data = Send_data.toString() + "\r\n";
          ConnectProcs[pid].stdin.setEncoding = 'utf-8';
          ConnectProcs[pid].stdin.write(Send_data);
        }
      });
   }
   catch(e){
     console.log("Exception " + e);
   }  
 }

async function Script_Watch(timerout)
{
   
  gTimerHndl = setInterval(()=>{
    console.log("watchDog started.." + zip_Unzip_queue.size() )
    if(zip_Unzip_queue.size() > 0)
    {
      for (item in zip_Unzip_queue)
      {
        ConnectToscript()
      }
    }
    else
    {
      console.log("Clear Interval :")
      clearInterval(gTimerHndl)
    }
  },timerout == null ? 3000 : timerout)
}


 async function ConnectToscript() 
 {  
    let ProcessLen = Object.keys(ConnectProcs).length
    console.log("\b\nNumber Of Process Running :"  + ProcessLen)

    if(ProcessLen < MAX_PROCESS) 
    {
      var execFile = require('child_process').execFile;
       let path = zip_Unzip_queue.receive()
      let ProcessHndle = execFile(executer, [File_, path],{
       detached: false,
     })
      ConnectProcs[ProcessHndle.pid] = ProcessHndle

     ProcessHndle.on('exit', function (code) 	
     {	
       try	
       {	
        
         console.log('[Iris_Scheduler : ' + ProcessHndle.pid.toString() +'] PID Killed  ' );	
         ConnectProcs[ProcessHndle.pid].kill();	 
       }	
       catch(ex)	
       {	
         console.log('[Iris_Scheduler] Process Exception while killing : ' + ex);	
       }	
       finally
       {
        delete ConnectProcs[code]
       }
     })

 
     ProcessHndle.stdout.on('data', function (data) 
     {
       try	
       {      
         console.log('[Iris_Scheduler] On Data From Python : ')    
          var Payload = data.toString();	
          console.log(Payload)   	
       }	
       catch(ex)	
       {	
         console.log('[Iris_Scheduler] On Data received  Exception' + ex);	
       }	
      });
       console.log("\n\n-->zip_Unzip_queue size : " + zip_Unzip_queue.size() +"\n\n")
    }
 };
 
function CheckIfProcessExist(PID , callback)
{
  let Exitstatus = true
  try
  {
    if(ConnectProcs.hasOwnProperty(PID))
    {
      console.log("PID was found : " + PID)
      Exitstatus = true
    }
    else
    {
      console.log("PID was not found : " + PID )
      Exitstatus = false
    }
  }
  catch(ex)
  {
    console.log("CheckIfProcessExist Catch Block " + ex)
    Exitstatus = false
  }
  finally
  {
    ConnectProcs[pid] = null;
    callback(Exitstatus)
  }
}

 function KillConnectProcs(pid)
 {
    console.log("[KillConnectProcs] Init.. ")
    CheckIfProcessExist(pid, (Livestatus) =>{
      if(Livestatus)
      {
        try
        {
          console.log("[KillConnectProcs] Killed : " + pid)
          ConnectProcs[pid].kill();
        }
        catch(ex)
        {
          console.log("[KillConnectProcs] Catch Block " + ex)
        }
      }
    })
 }

function CheckIfFileExist(file, cntr, callbackStatus)
{
  try
  {
    fs.access(file, function(error) 
    {
      if (error) {
        console.log("Dir/File does exist : " + file)
        callbackStatus(file, cntr)
      } else {
        console.log("Dir/File exists : " + file)
        callbackStatus(file, cntr)
      }
    })  
  }
  catch(ex)
  {
     console.log("[CheckIfFileExist] Catch Block " + ex)
  }
}

(async function() 
{
  try
  {
    console.log("Script Started...")
    while(Filecntr <= totalFiles)
    {
      var FolderPath = ZippedPath + ZipFileName + Filecntr.toString() + ".zip"         
      CheckIfFileExist(FolderPath, Filecntr, (existStatus, Filecntr_)=>
      {
          console.log("Main Function started.step1")
          //if(existStatus == null)
          {
            FolderPath = outputPath + ZipFileName + Filecntr_.toString()         
            CheckIfFileExist(FolderPath, Filecntr_, (existFolderPath, _Filecntr_)=>
            {
              zip_Unzip_queue.send( _Filecntr_)
              console.log("Main Function started.." + zip_Unzip_queue.size() )
            });
          }
      })
      Filecntr++ 
    }
    Script_Watch(2000)
  }
  catch(ex)
  {
    console.log("[Main] Exception " +ex)
  }
})();

