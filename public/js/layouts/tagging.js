function changeTagSelection(e){
  console.log('CHANGE THE SELECTED FOLDER TAG! \nTABLE ROW: ', e.currentTarget);
  var params = e.currentTarget.childNodes;
  var folder_ent = {};
  console.log(params);
  params.forEach((ent)=>{
    console.log('\n\n\nfolderTag!!!! ', ent);
    if(ent.className.indexOf('folderID') > -1)  folder_ent.Folder = ent.textContent;
    else if(ent.className.indexOf('folderphoto_count')>-1) folder_ent.photo_count = ent.textContent;
    else if(ent.className.indexOf('folderDescription')>-1) folder_ent.Description = ent.textContent;
  });
  console.log('\n\nTable Row PARAMS to set New Taglist! : ', params);
  var selections = document.querySelectorAll('.currentselection');
  if(selections){
    selections.forEach((sel)=>{
      sel.classList.remove('currentselection');
      sel.children[0].classList.remove('selectedspacer');
    });
  }
  e.currentTarget.classList.add('currentselection');
  e.currentTarget.children[0].classList.add('selectedspacer');

  var lab = folder_ent.Folder;
  if(folder_ent.Folder.indexOf('Photos')===-1) lab = lab + " Photos";
  enableGallery(true, lab);
  clearGallery();
  clearTabSelected();
  var previouslies = document.getElementById('secondarySelection').querySelectorAll('.selectedTag');
	if(previouslies.length > 0) removeClass(previouslies, 'selectedTag');
  // setFolderTag(params)
  setFolderTag(folder_ent);

  document.getElementsByClassName('galleryHandles')[0].classList.add('condense');
  document.getElementsByClassName('rightside_grid')[0].classList.add('condense');
  // document.getElementsByClassName('galleryHandles')[0].classList.remove('condense');
  // document.getElementById('secondarySelection').classList.remove('hidedisable');
  $('#before_tab').click();
}

function incrementFolderCount(inc){
  console.log('\n\n\nGET FOLDER TAG: ');
  console.log('\nFOLDER TAG: ',getFolderTag());
}

function loadTagList(list){
  if(!list.rows) return disableListRef(['workOrder', 'contractorRef']);
  console.log('\n\n\nTAG LIST DETECTED ! ',list);
  console.log('\n\n\nCREATE TAGLIST SELECTION FOLDER TABLE!');
  var dataList = [];
  list = list.rows;
  list.forEach((entry, index)=>{
    console.log('\n\n\nTAGLIST ENTRY #' + index + ': ', entry);
    dataList.push({
      Folder: entry.TagName,
      // Tier: entry.Tier,
      Description: entry.Description,
      photo_count: entry.photo_count
    });
  });



  (function(){
    setDataTable($('#folder_table').DataTable({
      columns: [
        {data: "Folder", class:"folderID", value: "Folder"},
        // {data: "Tier", title: "Tier", class:""},
        {data: "photo_count", class: "folderphoto_count", name: "photo_count", title: "#"},
        {data: "Description", class: "folderDescription fillClass", name: "Description", title: "Description"}
      ],
      order:[[1, "desc"]],
      api: true,
      // responsive: false,
      //   columnDefs: [
      //       { responsivePriority: 1, targets: 0 },
      //       { responsivePriority: 2, targets: -1 }
      //   ],
      data: dataList,
      // lengthChange: false,
      paging: false,
      searching: false,
      stateLoaded: function(settings, data){
        console.log('\n\nDATATABLES TAGLIST state Loaded!: ', e, '\nSettings : ', settings, '\n\nData: ', data);
      }
    }));
  })();

  document.body.querySelectorAll('#folder_table tbody tr').forEach((row)=>{
    console.log('\nTable Row : ', row);
    // if()
    row.addEventListener('click', changeTagSelection);
  });
}
