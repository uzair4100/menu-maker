const electron = require("electron");
const { shell, webFrame } = require("electron");
const ipcRenderer = electron.ipcRenderer;
const path = require("path");
const http = require("http");
const https = require("https");
const fs = require("fs");
var cheerio = require("cheerio");
var pretty = require("pretty");
const os = require('os');
const axios = require('axios').default;


$(document).ready(function() {
    ipcRenderer.send("chooseFile-dialog");
    checkUpdates()
        //open links in default browser
    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

    // Set the zoom factor to 92%
    webFrame.setZoomFactor(0.84);


    var cheer,
        unit1Name,
        unit2Name,
        source,
        source2,
        bak,
        newFile,
        yearCalender,
        course,
        year,
        checker,
        heading,
        language,
        options,
        toolbarOptions,
        worksetHeader,
        oralLessonHeader,
        workset1 = "",
        ol1 = "",
        workset2 = "",
        ol2 = "",
        outcome1 = "",
        outcome2 = "",
        sem_div2 = "",
        s1_path, s2_path,
        seminar1, seminar2, s1, s2;

    $("#status").hide();
    $("#unit2Name").hide();

    $("#units>li").click(function() {
        if ($(this).children("a").prop("id") == "tabs-1") {
            $("#unit1Name").fadeIn(1000);
            $("#unit2Name").hide();
        } else {
            $("#unit2Name").fadeIn(1000);
            $("#unit1Name").hide();
        }
    });

    worksetHeader = `
    <!--stat workset header-->
    <div class="d-flex justify-content-start p-2 bg-info text-white" id="worksetHeader">
      <p class="h5 ml-3 mr-5">ID</p>
      <p class="h5 ml-2">No</p>
      <p class="h5 ml-4 mr-2">Visible</p>
      <p class="h5 mx-5">Duedate</p>
      <p class="h5" style="margin-left: 100px !important">Name:</p>
    </div>
    <!--end workset header-->`;

    oralLessonHeader = `
    <div class="d-flex justify-content-between p-2 bg-info text-white" id="oralLessonHeader">
      <p class="h5 ml-3">ID</p>
      <p class="h5 mr-5">Description</p>
      <p class="h5 mr-5">Duedate</p>
    </div>
                    `;

    //customize quill
    var Bold = Quill.import("formats/bold");
    var Italic = Quill.import("formats/italic");
    Bold.tagName = "B"; // Quill uses <strong> by default
    Italic.tagName = "I"; // Quill uses <em> by default
    Quill.register({ Bold: true, Italic: true });

    toolbarOptions = [
        [{ header: [1, 2, 3, 4, 5, false] }],
        ["bold", "italic", "underline"],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ["link", "video"]
    ];
    options = {
        modules: {
            toolbar: toolbarOptions
        },
        clipboard: {
            matchVisual: false
        },
        placeholder: "Type description here...",
        theme: "snow"
    };


    $("#left").change(function() {
        $("ul.nav-tabs a").click(function(e) {
            e.preventDefault();
            $(this).tab("show");
        });

        //empty tab divs
        $(".ws,.ol,.oc,.sem").html("");

        workset1 = "", workset2 = "", ol1 = "", ol2 = "", outcome1 = "", outcome2 = "", seminar1, seminar2;
        //get path
        yearCalender = $('#yearCalender').find('option').filter(':selected').text().trim();
        course = $("#courses").find("input[type=radio]:checked").siblings("label").text();
        year = $("#year").find("input[type=radio]:checked").siblings("label").text();

        if ($("#testing").is(":checked")) {
            //variables for testing 
            s1_path = path.join(os.homedir(), "Desktop/seminar1.html");
            s2_path = path.join(os.homedir(), "Desktop/seminar2.html");
            source = path.join(require("os").homedir(), "Desktop/menu.xml");
            source2 = path.join(require("os").homedir(), "Desktop/menu_test.xml");

        } else {
            source = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\menu.xml";
            source2 = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\menu_test.xml";
            bak = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\menu.xml.bak";
            s1_path = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\seminar1.html";
            s2_path = "\\\\vsl-file01\\coursesdev$\\courses\\" + yearCalender + "\\" + course + "\\" + year + "\\seminar2.html";
        }

        s1 = fileRead(s1_path);
        s2 = fileRead(s2_path);
        console.log(source)
        console.log(s1_path)
        console.log(s2_path)

        //read file
        fs.readFile(source, "utf-8", function(err, data) {
            if (!err) {
                data = data.replace(/&amp;(?!(\S)+;)/g, "&");
                //console.log(data);
                cheer = cheerio.load(data, { normalizeWhitespace: true, xmlMode: true, decodeEntities: false, withDomLvl1: true });

                // console.log(cheer.html());

                //write title and language
                heading = cheer("course").attr("title");
                $("#courseName").val(heading);
                language = cheer("course").attr("language");
                $("#language").val(language);

                //write unit names
                unit1Name = cheer("unit").first().attr("name");
                unit2Name = cheer("unit").last().attr("name");

                //console.log(unit1Name);
                //console.log(unit2Name);
                $("#unit1Name").val(unit1Name);
                $("#unit2Name").val(unit2Name);

                //set tabnames
                $("#tabs-1").html(unit1Name);
                $("#tabs-2").html(unit2Name);
                $(".ws").html(cheer("worksets").attr("tabname"));
                $(".ol").html(cheer("orallessons").attr("tabname"));
                $(".oc").html(cheer("outcomes").attr("tabname"));
                $(".sem").html(cheer("seminars").attr("tabname"));

                //change tab name according to input
                $("#unit1Name").bind("change paste keyup", function() {
                    $("#tabs-1").html($(this).val());
                });

                $("#unit2Name").bind("change paste keyup", function() {
                    $("#tabs-2").html($(this).val());
                });

                var first = cheer("unit").first();
                var second = cheer("unit").last();
                var sem1Stats = $("#seminar1");
                var sem2Stats = $("#seminar2");
                // $("#seminar1,#seminar2").append(`<button class="btn btn-primary btn-lg mt-1 add">Add Seminar</button>`);

                //call functions to get html
                workset1 = getWorkset(first);
                workset2 = getWorkset(second);
                ol1 = getOrallesson(first);
                ol2 = getOrallesson(second);
                outcome1 = getOutcome(first);
                outcome2 = getOutcome(second);
                seminar1 = getSeminar(s1, 1);
                seminar2 = getSeminar(s2, 2);

                //console.log(seminar1)
                //console.log(seminar2)
                //inject html in divs
                $("#workset1").html(worksetHeader + "\n" + workset1);
                $("#workset2").html(worksetHeader + "\n" + workset2);
                $("#oral1").html(oralLessonHeader + "\n" + ol1);
                $("#oral2").html(oralLessonHeader + "\n" + ol2);
                $("#outcome1").html(outcome1);
                $("#outcome2").html(outcome2);
                $("#seminar1").html(seminar1);
                $("#seminar2").html(seminar2);
                $("#seminar1,#seminar2").prepend(`<button class="btn btn-primary add">add</button>`);

            } else {
                $("#workset1,#workset2,#oral1,#oral2,#outcome1,#outcome2,#seminar1,#seminar2").html(err);
                // $("#workset2").html(err);
            }
        });
        //seminar accordian

    }); //end wrapper inner

    $(document).click(function(e) {

        if ($(e.target).attr('class') == "del") {
            $(e.target).parent().parent().parent().children('.sem').length > 1 ? $(e.target).parent().parent('.sem').remove() : ''; //delete seminar only if more than 2
            console.log("clicked");
        }

        if ($(e.target).hasClass("add")) {
            let lastSeminar = $(e.target).closest('.tab-pane').children(".sem").last();
            let no = lastSeminar.find(".no").html();
            no = parseInt(no.charAt(no.length - 1))
                //alert(no)
            console.log(lastSeminar)
            let holder = lastSeminar.clone();
            //holder=$.parseHTML(holder)
            holder.find('.no').html(`Seminar ${no+1}`);
            lastSeminar.after(holder);
        }
        // $(".sem_selector").siblings().slideUp();
        if ($(e.target).hasClass("sem_selector")) {
            let selector = $(e.target);
            let others = selector.parent().siblings();

            selector.find('.sign').addClass("minus");
            selector.siblings().slideToggle();
            selector.find(".name").parent().siblings(".myDIV").slideToggle();
            others.find(".sem_content").slideUp();
            others.find(".myDIV").slideUp();
        }

    })

    /////////////////////////////////////////////////////////////////// submit ///////////////////////////////////////////////////////////////////////

    //submit
    $("#submit").click(function() {
        if (confirm("Update " + course + " " + year + " ?")) {
            //get title
            heading = $("#courseName").val();
            cheer("course").attr("title", heading);
            language = $("#language").val();
            cheer("course").attr("language", language);

            //get name
            unit1Name = $("#unit1Name").val();
            cheer("unit").first().attr("name", unit1Name);
            unit2Name = $("#unit2Name").val();
            cheer("unit").last().attr("name", unit2Name);

            // console.log(cheer.html());
            var newWorkset = "",
                u1_Workset = "",
                u2_Workset = "";
            u1_orallesson = "";
            u2_orallesson = "";
            u1_outcome = "";
            u2_outcome = "";

            var firstWorkset = $("#unit1 .workset");
            var secondWorkset = $("#unit2 .workset");
            var firstOrallesson = $("#unit1 .oralLesson");
            var secondOrallesson = $("#unit2 .oralLesson");
            var firstOutcome = $("#unit1 .outcome");
            var secondOutcome = $("#unit2 .outcome");
            var firstSeminar = $("#seminar1");
            var secondSeminar = $("#seminar2");


            //get content from functions
            u1_Workset = saveWorkset(firstWorkset);
            u2_Workset = saveWorkset(secondWorkset);
            u1_orallesson = saveOrallesson(firstOrallesson);
            u2_orallesson = saveOrallesson(secondOrallesson);
            u1_outcome = saveOutcome(firstOutcome, 1);
            u2_outcome = saveOutcome(secondOutcome, 2);

            var sem1Content = saveSeminar(s1, firstSeminar);
            sem1Content = pretty(sem1Content);
            var sem2Content = saveSeminar(s2, secondSeminar);
            sem2Content = pretty(sem2Content);


            //console.log(sem1Content);
            //console.log(sem2Content);

            //write new content in cheerio
            cheer("worksets").first().html(u1_Workset);
            cheer("worksets").last().html(u2_Workset);
            cheer("orallessons").first().html(u1_orallesson);
            cheer("orallessons").last().html(u2_orallesson);
            cheer("outcomes").first().html(u1_outcome);
            cheer("outcomes").last().html(u2_outcome);

            newWorkset = cheer.html();
            newWorkset = newWorkset
                .replace(/&(?!(\S)+;)/g, "&amp;")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/<p><br[\/]?><[\/]?p>/g, "");
            newWorkset = pretty(newWorkset, { ocd: true });
            //console.log(newWorkset);

            setTimeout(() => {

                if ($('#updateMenu').prop("checked") == true) {
                    fs.writeFile(source, newWorkset, function(err) {
                        if (!err) {
                            fs.writeFileSync(source2, newWorkset);
                            fs.writeFileSync(bak, newWorkset);

                            $("#status").addClass('alert-primary').removeClass('alert-danger').html("Updated " + course + " " + year);
                            displayMessage();
                        } else {
                            $("#status").removeClass('alert-primary').addClass('alert-danger').html("Some Error occurred!!!");
                            displayMessage();
                        }
                    });

                }
                if ($('#updateSeminar').prop("checked") == true) {
                    try {
                        fs.writeFileSync(s1_path, sem1Content);
                        fs.writeFileSync(s2_path, sem2Content);
                        $("#status").addClass('alert-primary').removeClass('alert-danger').html("Updated " + course + " " + year);
                        displayMessage();
                    } catch (err) {
                        $("#status").removeClass('alert-primary').addClass('alert-danger').html("Could not update seminars!!!");
                        displayMessage();
                    }
                }

            }, 1000);
            //console.log(newContent)
        }
    });
    //////////////////////////////end submit function //////////////////////////////////////////

    //==============functions=============================
    function getWorkset(no) {
        let workset = "";
        no.find("workset").each(function() {
            //console.log(cheer(this).text());
            if (!cheer(this).attr("hide") || cheer(this).attr("hide") == "no") {
                checker = "checked";
            } else {
                checker = "";
            }
            let wsID = cheer(this).attr("id");
            let wsNum = cheer(this).attr("num");
            let dueDate = cheer(this).attr("due").toString().trim();
            let dateOnly = dueDate.slice(0, 4);
            dueDate = dueDate.slice(0, 4) + "-" + dueDate.slice(4, 6) + "-" + dueDate.slice(6, 8);
            let text = cheer(this).text();

            workset += `
             <!--bootsrap toggle-->
    <link href="https://gitcdn.github.io/bootstrap-toggle/2.2.2/css/bootstrap-toggle.min.css" rel="stylesheet" />
    <script src="https://gitcdn.github.io/bootstrap-toggle/2.2.2/js/bootstrap-toggle.min.js"></script>
            
<div class="d-flex justify-content-between align-items-center m-1 workset">
 <div class="form-group d-flex m-0">
   <input value= "${wsID}" maxlength="2" type="number" class="form-control" id="wsID" aria-describedby="emailHelp" placeholder="Enter email" style="width:60px;height:35px" disabled/>
 </div>
 <div class="form-group d-flex m-0">
   <input value= "${wsNum}" maxlength="2" type="number" class="form-control" id="wsNum" placeholder="Password" style="width:60px;height:35px" disabled/>
  </div>
  <div class="form-group d-flex m-0">
   <input id="Hide" type="checkbox" data-toggle="toggle" data-width="70" data-height="30" data-onstyle="secondary" data-offstyle="danger" data-on="Yes" data-off="No" ${checker}>
 </div>
 <div class="form-group d-flex m-0">
   <input value= "${dueDate}" size="2" type="date" class="form-control" id="dueDate" />
</div>
 <div class="form-group d-flex m-0">
   <input type="text" style="width:300px;" class="form-control" id="wsName" value="${text}"></input>
 </div>
</div>
                
                    `;
        });
        return workset;
    }

    function saveWorkset(no) {
        let workset = "";
        //save workset data
        no.each(function() {
            // console.log($(this).find('#wsName').text())
            let wsID = $(this).find("#wsID").val();
            let wsNum = $(this).find("#wsNum").val();
            let text = $(this).find("#wsName").val();
            let dueDate = $(this).find("#dueDate").val();
            dueDate = dueDate.split("-").join("");
            let hideValue, hideAttr;
            if ($(this).find("#Hide").prop("checked") == false) {
                hideValue = "disabled";
                hideAttr = `hide="${hideValue}"`;
            } else {
                hideValue = "no";
                hideAttr = `hide="${hideValue}"`;
            }
            workset += `<workset id="${wsID}" ${hideAttr} num="${wsNum}" due="${dueDate}">${text}</workset>`;
        });
        return workset;
    }

    function getOrallesson(no) {
        let oralLesson = "";
        no.find("orallesson").each(function() {
            let olID = cheer(this).attr("id");
            let desc = cheer(this).attr("description");
            let dueDate = cheer(this).attr("datedue");

            oralLesson += `
             
            
              <div class="d-flex justify-content-between align-items-center mx-1 my-3 oralLesson">
               <div class="form-group d-flex">
                <input value= "${olID}" style="width:60px;" type="number" class="form-control" id="olID" disabled/>
               </div>
               <div class="form-group d-flex">
                 <input type="text" style="width:500px;" class="form-control" id="desc" value="${desc}"></input>
               </div>
               <div class="form-group d-flex">
                 <input type="text" style="width:200px;" class="form-control" id="datedue" value="${dueDate}"></input>
               </div>
              </div>
              `;
        });
        return oralLesson;
    }

    function saveOrallesson(no) {
        let oralLesson = "";
        //save orallesson data
        no.each(function() {
            // console.log($(this).find('#wsName').text())
            let olID = $(this).find("#olID").val();
            let desc = $(this).find("#desc").val();
            let dueDate = $(this).find("#datedue").val();

            oralLesson += `<orallesson id="${olID}" description="${desc}" datedue="${dueDate}"></orallesson>`;
        });
        return oralLesson;
    }

    function getOutcome(no) {
        let u = no.attr("id");
        let outcome = "",
            count = 0;
        let editor = [];
        no.find("outcome").each(function() {
            let ocID = cheer(this).attr("id");
            let datedue = cheer(this).attr("datedue");
            datedue = datedue.slice(0, 4) + "-" + datedue.slice(4, 6) + "-" + datedue.slice(6, 8);
            let name = cheer(this).children("name").text().trim();
            let duration = cheer(this).children("duration").text().trim();
            let description = cheer(this).children("description").text().trim();
            editor.push("editor_" + u + "_" + ocID);
            let numb = editor.length;
            outcome += `
          <div class="bg-white my-3 mx-4 pb-2 h-100% rounded shadow  border border-info outcome">
          <div class="bg-info text-white mb-2 py-2 text-center">Outcome${numb}</div>

           <div class="container">
              <div class="row  mb-2">
                  <div class="input-group col-3">
                      <div class="input-group-prepend">
                          <span class="input-group-text text-bold">ID</span>
                      </div>
                      <input value="${ocID}" maxlength="2" type="number" class="form-control" id="ocID" disabled />
                  </div>
                  <div class="input-group col-1"><!--empty div--></div>
                  <div class="input-group col-8">
                      <div class="input-group-prepend">
                          <span class="input-group-text text-bold ">Duration</span>
                      </div>
                      <input type="text" class="form-control" id="duration" placeholder="e.g. 20 mins" value="${duration}"></input>
                  </div>
                  <div class="input-group col-2"><!--empty div--></div>
               </div>
              <div class="row mb-3">
                  <div class="input-group col-4">
                      <div class="input-group-prepend">
                          <span class="input-group-text text-bold">Due</span>
                      </div>
                      <input value="${datedue}" style="padding:4px;" type="date" class="form-control" id="datedue" />
                  </div>
                  <div class="input-group col-8">
                  <div class="input-group-prepend">
                      <span class="input-group-text text-bold">Name</span>
                  </div>
                  <input type="text" class="form-control" id="name" placeholder="e.g. Outcome 1: Interpersonal communication" value="${name}"></input>
              </div>
      
              </div>
              <!--body end-->
      
              <div class="w-100" placeholder="Description" id="editor_${u}_${ocID}">${description}</div>
            </div>
          </div>
                `;
            setTimeout(() => {
                editor[count] = new Quill(`#editor_${u}_${ocID}`, options);
                console.log(editor[count]);
                count++;
            }, 200);
        }); //loop
        console.log(editor);
        return outcome;
    }

    function saveOutcome(no, u) {
        let outcome = "";
        //save outcome data
        no.each(function() {
            let ocID = $(this).find("#ocID").val();
            let datedue = $(this).find("#datedue").val();
            datedue = datedue.split("-").join("");
            let name = $(this).find("#name").val();
            let duration = $(this).find("#duration").val();
            let editorName = `#editor_${u}_${ocID}`;
            let description = $(editorName).find(".ql-editor").html();
            description = description.replace(/<p><br[\/]?><[\/]?p>/g, "").replace(/<p><b[\/]?>\s<[\/]?p>/g, "");
            //console.log(description);

            outcome += ` <outcome id="${ocID}" datedue="${datedue}">
                <name>
                  <![CDATA[${name}]]>
                </name>
                <duration>
                  <![CDATA[${duration}]]>
                </duration>
                <description>
                  <![CDATA[${description}]]>
                </description>
              </outcome> `;
        });
        //console.log(outcome);
        return outcome;
    }

    function getSeminar(content, s) {
        let sem = "";
        let editor = [];
        let $ = cheerio.load(content, { normalizeWhitespace: true, xmlMode: false, decodeEntities: false, withDomLvl1: true });
        sem_div2 = $('.seminar_divs-column2').html()
        console.log(sem_div2)
            //start loop
        $('.seminar').each(function(i) {
            let name = $(this).find('.seminar-name').html();
            let dueDate = $(this).find('.dt').html();
            let desc = $(this).find('.myDIV').html();
            //console.log(name);
            //console.log(dueDate);
            //console.log(desc);

            editor.push("editor_" + s + "_" + i);
            sem += ` 
                        <div class="bg-white my-3 mx-4 pb-2 h-100% rounded shadow  border border-dark sem">
                            <div class="d-flex justify-content-between bg-dark text-white mb-2 py-1 text-center sem_selector">
                                <div class="h4 sign">+</div>
                                <div class="no">Seminar ${i + 1}</div>
                                <div class="del">X</div>
                            </div>

                           <div class="container sem_content">                    
                                <div class="row mb-3">
                                    <div class="input-group col-5">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text text-bold">Due Date</span>
                                        </div>
                                        <input type="text" class="form-control" id="dueDate" placeholder="e.g. Wed, 10th March" value="${dueDate}"></input>
                                    </div>
                                    <div class="input-group col-7">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text text-bold">Name</span>
                                        </div>
                                        <input type="text" class="form-control" id="name" placeholder="e.g. Seminar 1: Interpersonal communication" value="${name}"></input>
                                    </div>

                                </div>
                                <!--body end-->
                                <div class="w-100 desc" id="s_editor_${s}_${i}">${desc}</div>
                          </div>
                        </div> 
                    `;

            setTimeout(() => {
                editor[i] = new Quill(`#s_editor_${s}_${i}`, options);
                console.log(editor[i]);
            }, 200);
        }); //end loop

        return sem;
    }

    function saveSeminar(content, newContent) {
        let seminarData = "",
            sem_div2 = "";
        let $ = cheerio.load(content);
        $('.seminar_divs-column1').html('')
            //start loop
        newContent.find('.sem').each(function(i) {

            let newName = newContent.find('#name').eq(i).val();
            let newDate = newContent.find('#dueDate').eq(i).val();
            let newDesc = newContent.find(".ql-editor").eq(i).html();

            let currentSeminar = $(".seminar").eq(i);
            console.log(currentSeminar)
            let id = `"sem"${i+1}`;

            let newSem = `
                        <div class="seminar">
                            <div class="seminar-selector">
                                <div class="seminar-name">${newName}</div>
                                <div class="dt">${newDate}</div>
                            </div>
                            <div style="clear:both"></div>
                            <div id="sem${i+1}" class="myDIV">${newDesc}</div>
                        </div>`;

            $('.seminar_divs-column1').append(newSem)
            console.log(newSem)



        }); //end loop
        $('.seminars_divs').append(`<div class="seminar_divs-column2">${sem_div2}</div>`);
        $(".seminar_divs-column2").each(function() {
            $(this).html() ? "" : $(this).remove();
        })

        seminarData = $.html();

        console.log(seminarData);
        return seminarData;
    }


    //read seminar file
    function fileRead(file) {
        let fileContents
        try {
            fileContents = fs.readFileSync(file, 'utf-8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('File not found!');
                fileContents = `<div style=" text-align: center !important;
                color: black !important;
                font-size: 30px !important;
                font-weight: 600 !important;">${err}</div>`
            } else {
                throw err;
            }
        }
        return fileContents
    }

    //display status
    function displayMessage() {
        $("#status").show();
        setTimeout(function() {
            $("#status").fadeOut(500);
        }, 3000);
    }


    function checkUpdates() {

        let user = "uzair4100";
        let repo = "menu-maker";
        let outputdir = path.join(os.homedir(), "AppData/Local/menu-maker/pending");
        console.log(outputdir);
        let leaveZipped = false;

        ipcRenderer.on("_version", function(e, appVersion) {
            console.log(appVersion);
            let currentVersion = appVersion;
            axios.get(`https://api.github.com/repos/${user}/${repo}/releases/latest`)
                .then((resp) => {
                    let data = resp.data
                    console.log(data)
                    let appName = data.assets[0].name;
                    let latestVersion = data.tag_name;
                    console.log('latestVersion is ' + latestVersion);
                    if (appVersion != "") {
                        if (currentVersion != latestVersion) {
                            console.log("update found")
                                // modal.style.display = "";
                                // document.querySelector(".card-body").innerHTML = "update found";
                            if (fs.existsSync(outputdir + "/" + appName)) {
                                ipcRenderer.send("downloaded")
                            } else {
                                // modal.style.display = "";
                                // !fs.existsSync(outputdir) ? fs.mkdirSync(outputdir) : "";
                                let existingFile = fs.readdirSync(outputdir).filter((file) => path.extname(file) == ".exe"); //check for existing exe file and delete them first
                                existingFile.forEach((file) => fs.unlinkSync(outputdir + "/" + file));
                                //console.log(data)
                                let url_exe = data.assets[0].browser_download_url;
                                console.log(url_exe)
                                    // shell.openExternal(url_exe)
                                let dest = path.join(outputdir, appName);
                                var file = fs.createWriteStream(dest);

                                axios({
                                    url: url_exe,
                                    method: 'GET',
                                    responseType: 'arraybuffer', // important
                                    onDownloadProgress: (progressEvent) => {
                                        let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                        console.log(percentCompleted);
                                        //document.querySelector(".card-body").innerHTML = "Downloading Updates...";
                                        //document.querySelector('#bar').innerHTML = `<div class="progress">
                                        //<div class="progress-bar progress-bar-striped" role="progressbar" style="width:${percentCompleted}%" aria-valuenow="${percentCompleted}">${percentCompleted}%</div></div>`
                                    }
                                }).then(response => {
                                    const buffer = Buffer.from(response.data, 'base64');
                                    file.write(buffer, 'base64');
                                    //displayUpdateStatus(modal, "Successfully Downloaded", 1500);

                                    file.on('finish', () => {
                                        console.log('wrote all data to file');
                                        ipcRenderer.send("downloaded"); //send event to main process to ask for update
                                    });

                                    // close the stream
                                    file.end();
                                })

                            }

                            //show messagebox and begin installation if user response is yes (0)
                            ipcRenderer.on("user-response", function(e, index) {
                                if (index == 0) {
                                    //displayUpdateStatus(modal, "Starting Installation", 3000);
                                    shell.openExternal(outputdir + "/" + appName)
                                    ipcRenderer.send("close-app")
                                } else {
                                    modal.style.display = "none";
                                }
                            });
                        } else {
                            console.log("up to date")
                        }
                    }
                });
        });
    }

    //clear app
    $("#clear").click(function() {
        location.reload();
    });
});