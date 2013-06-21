/*jslint browser: true*/
/*global $, jQuery, DOMParser, XMLSerializer, XSLTProcessor, XPathResult, CodeMirror */

function does_nothing() {
	"use strict";
	/*
	Filler function for an button that is implemented yet not operational. Also used for debugging.
	*/

	alert('This button is currently nonfunctional. Please try again later.');
}

function randomString(string_length) {
	"use strict";
	/*
	Creates a random string, of length = string_length, consisting of alphanumeric characters.
	*/

	var chars, randomstring, i, rnum;
	chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	randomstring = '';
	for (i = 0; i < string_length; i++) {
		rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, (rnum + 1));
	}
	return randomstring;
}

function toggle_menu(img_name, div_name) {
	"use strict";
	/*
	Toggles a right-arrow to a down-arrow upon clicking.
	A down-arrow expands a section, while a right-arrow hides it.
	*/

	var state;
	//Plus sign in front of document.blah is used to quickly convert to integer.
	state = (+document.getElementById(div_name).getAttribute("data-switch"));
	if (state === 0) {
		document.getElementById(img_name).src = "/images/DownTriangleIcon.png";
		document.getElementById(div_name).style.display = "block";
		document.getElementById(div_name).setAttribute("data-switch", 1);
	} else if (state === 1) {
		document.getElementById(img_name).src = "/images/RightFillTriangleIcon.png";
		document.getElementById(div_name).style.display = "none";
		document.getElementById(div_name).setAttribute("data-switch", 0);
	} else {alert('Still not working'); }
}

function toggle_button(div_name, disable) {
	"use strict";
	/*
	Toggles a button from disabled to enabled, or vice versa. Disable = true for enabled-to-enabled, and false for disabled-to-enabled.
	Also changes the image, assuming the image follows a naming scheme as follows:
		Located in wamp/www/images folder.
		Enabled version is named 'semicon_divname.png'
		Disabled version is named 'semicon_divname_inactive.png'
	*/

	var img_name;
	if (disable === true) {
		document.getElementById(div_name).setAttribute("disabled", "disabled");
		img_name = "/images/seqicon_" + div_name + "_inactive.png";
		document.getElementById(div_name).setAttribute("src", img_name);
	} else if (disable === false) {
		document.getElementById(div_name).removeAttribute("disabled");
		img_name = "/images/seqicon_" + div_name + ".png";
		document.getElementById(div_name).setAttribute("src", img_name);
	} else {
		alert('disable should only be true or false');
	}
}

function populate_file_info() {
	"use strict";
	/*
	Provides a description of a file selected in the file menu, including (if available): filename, description, last saved, and last saved by.
	*/

	document.getElementById('file_info_div').innerHTML = 'File:&nbsp;<b>' + document.getElementById('folder_select').value + '/' + document.getElementById('file_select').value + '</b><div id="file_desc">Description:</div><br />Last Saved: <br />Last Saved By: ';
	document.getElementById('load_file').value = ("c:/wamp/www/MetaViewer/sequences/" + document.getElementById('folder_select').value + "/" + document.getElementById('file_select').value).replace('//', '/');
}

function populate_files(folder_select) {
	"use strict";
	/*
	Gets files and folders from c:/wamp/www/MetaViewer/sequences/some_folder via lookup_sequences.php.
	Displays results. Upon selection, sends value to load_file textbox and opens populate_file_info() function.
	*/

	$("#file_op").load("lookup_sequences.php?folder=" + folder_select.value, function (data) {
		if (document.getElementById("file_select") !== null) {
			document.getElementById("file_select").parentNode.removeChild(document.getElementById("file_select"));
		}
		var files, fileselect, k, newfileinput;
		files = data.split(',');
		fileselect = document.getElementById("file_operations").insertBefore(document.createElement('select'), document.getElementById("file_operations").firstChild.nextSibling);
		fileselect.setAttribute('id', 'file_select');
		fileselect.options[fileselect.options.length] = new Option('Select File:  ', 'none');
		for (k = 0; k < files.length; k++) {
			fileselect.options[fileselect.options.length] = new Option(files[k], files[k]);
		}
		fileselect.setAttribute('multiple', 'multiple');
		fileselect.setAttribute('size', '8');
		document.getElementById('file_select').onchange = function () {
			if (fileselect.value !== "none") {
				populate_file_info();
			}
		};
	});
	if (document.getElementById("folder_select").selectedIndex === 1) {
		document.getElementById("file_op_target_input").selectedIndex = 1;
	}
	if (document.getElementById("folder_select").selectedIndex !== 1) {
		document.getElementById("file_op_target_input").selectedIndex = 0;
	}
}

function populate_folders() {
	"use strict";
	/*
	Gets folders from location c:/wamp/www/MetaViewer/sequences via loopkup_sequences.php.
	Then displays files in reverse-chronological order. Upon selecting a file, goes to populate_folders(folder_select) function.
	*/

	$("#file_op").load("lookup_sequences.php?folder=none", function (data) {
		if (document.getElementById("folder_select") !== null) {
			document.getElementById("folder_select").parentNode.removeChild(document.getElementById("folder_select"));
		}
		var folders, folderselect, k;
		folders = data.split(',');
		folderselect = document.getElementById("file_operations").insertBefore(document.createElement('select'), document.getElementById("file_operations").firstChild);
		folderselect.setAttribute('id', 'folder_select');
		folderselect.options[folderselect.options.length] = new Option('Select Folder:  ', 'none');
		for (k = 0; k < folders.length; k++) {
			folderselect.options[folderselect.options.length] = new Option(folders[k], '/' + folders[k]);
		}
		folderselect.setAttribute('multiple', 'multiple');
		folderselect.setAttribute('size', '8');
		document.getElementById('folder_select').onchange = function () {
			if (folderselect.value !== "none") {
				populate_files(this);
			}
		};
	});
}

function default_save_name() {
	"use strict";
	/*
	Creates default save name of "c:/wamp/www/MetaViewer/sequences/MM-DD-YYYY/HHh_MMm_SSs"
	*/

	var x, year, month, day, hour, minute, second, datetime, save_name;

	x = new Date();
	year = x.getFullYear();
	month = x.getMonth() + 1;
	day = x.getDate() + 1;
	hour = x.getHours();
	minute = x.getMinutes();
	second = x.getSeconds();
	datetime = month + "-" + day + "-" + year + "/" + hour + "h_" + minute + "m_" + second + "s";
	save_name = "c:/wamp/www/MetaViewer/sequences/" + datetime + ".xtsm";

	return save_name;
}

function load_new_file(arg) {
	"use strict";
	/*
	Load a file of the user's choice.
	Note: Given the versatility of the arg.load_file() function, this is not limited to xml strings in the future.
	*/

	var filename;
	filename = document.getElementById("load_file").value.split('c:/wamp/www').pop();
	arg.load_file(filename, 'xml_string');
}

function save_file(arg) {
	"use strict";
	/*
	Saves the active XTSM under a save name of the user's choice, by way of the "save_file.php" file.
	*/

	var save_name, test_name, active_xtsm;
	//Get save value name.
	save_name = document.getElementById('save_file').value;
	//Get the active XTSM.
	active_xtsm = arg.editor.getValue();
	//Make sure the pathname does not contain any colons, besides c:/... This pathname is invalid.
	test_name = save_name.substring(2);
	if (test_name.indexOf(':') !== -1) {
		alert('File name cannot contain ":", besides "c:/..."');
	} else {
		$.post("save_file.php", {filename: save_name, filedata: active_xtsm}, function () {alert(results); });
	}
}
//ADD TO REFRESH - History/Undo, Search Tools
function refresh(arg) {
	"use strict";
	/*Refreshes code tree, resets load file and save file text boxes, 
	refreshes file select drop-down menu, eliminates speed test results, 
	resets python console.
	*/

	var index, select_length;
	arg.refresh_tree();
	document.getElementById('load_file').value = "";
	document.getElementById('save_file').value = default_save_name();
	populate_folders();
	document.getElementById('python_speed_result').innerHTML = '';
	document.getElementById('python_input_textarea').value = '';
	document.getElementById('python_response_textarea').value = '';

	select_length = document.getElementById('python_variable_list').length;
	for (index = 1; index < select_length; index++) {
		document.getElementById('python_variable_list').remove(1);
	}

}

function post_active_xtsm(arg) {
	"use strict";
	/*
	Sends active XTSM code to server via Ajax request.
	Also compresses the html parser div if the option is checked.
	*/

	var transferdata, boundary, _active_xtsm;
	boundary = "--aardvark";
	_active_xtsm = arg.editor.getValue();
	transferdata = [];
	transferdata[0] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'set_global_variable_from_socket' + '\n\r--' + boundary + '--\n\r';
	transferdata[1] = '--' + boundary + '\n\rContent-Disposition: form-data; name="_active_xtsm"\n\r\n\r' + _active_xtsm + '\n\r--' + boundary + '--\n\r';
	transferdata[2] = '--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r';
	transferdata = transferdata.join("");
	//alert(transferdata);
	$.ajax({
		url: 'http://127.0.0.1:8083',
		type: 'POST',
		contentType: 'multipart/form-data; boundary=' + boundary,
		processData: false,
		data: transferdata,
		success: function (result) {
			//alert(result);
		}
	});
	if (document.getElementById("compress_on_post_button").checked) {
		toggle_menu("parser_menu", "parser_operations");
	}
}

function retrieve_active_xtsm(arg) {
	"use strict";
	/*
	Retrieves active XTSM code from server via Ajax request.
	Then replaces the active XTSM in the code editor with the data retrieved.
	Also compresses the html parser div if the option is checked.
	*/

	var boundary, transferdata;
	boundary = '--aardvark';
	transferdata = [];
	transferdata[0] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'get_global_variable_from_socket' + '\n\r--' + boundary + '--\n\r';
	transferdata[1] = '--' + boundary + '\n\rContent-Disposition: form-data; name="variablename"\n\r\n\r' + '_active_xtsm' + '\n\r--' + boundary + '--\n\r';
	transferdata[2] = '--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r';
	transferdata = transferdata.join("");
	//alert(transferdata);
	$.ajax({
		url: 'http://127.0.0.1:8083',
		type: 'POST',
		contentType: 'multipart/form-data; boundary=' + boundary,
		processData: false,
		data: transferdata,
		dataType: 'text',
		success: function (result) {
			//alert(result);
			// Eliminates junk string at beginning of message, which was required so that the message would be a string.
			arg.editor.setValue(result);
		}
	});
	if (document.getElementById("compress_on_post_button").checked) {
		toggle_menu("parser_menu", "parser_operations");
	}
}

function launch_python() {
	"use strict";
	/*
	Launches python twisted server via Ajax (post) request. Server appears under system processes, not user processes.
	Cannot interact directly with server launched in this manner (eg. though Spyder), though all interactions with this GUI function.
	*/

	var url_out, port_out;
	url_out = '127.0.0.1';
	port_out = 8083;
	//The following ajax and post requests are identical in meaning, though the post request is less complex/faster.
	/*$.ajax({
		url: url_out + ':8081/MetaViewer/launch_python.php',
		type: 'POST',
		data: {port: port_out},
		success: function (data) {//alert(data); }
	});*/
	$.post('launch_python.php', {port: port_out}, function (data) {
		//alert(data);
	});
}

function disable_python_socket() {
	"use strict";
	/*
	Sends an Ajax request to the server which closes the server.
	*/

	var transferdata, boundary;
	boundary = "--aardvark";
	transferdata = [];
	transferdata[0] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'stop_listening' + '\n\r--' + boundary + '--\n\r';
	transferdata[1] = '--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r';
	transferdata = transferdata.join("");
	//alert(transferdata);
	$.ajax({
		url: 'http://127.0.0.1:8083',
		type: 'POST',
		contentType: 'multipart/form-data; boundary=' + boundary,
		processData: false,
		data: transferdata,
		success: function (result) {alert(result); }
	});
}

function test_pythontransferspeed(data_length, results) {
	"use strict";
	/*
	Tests how long it takes to send data to python twisted server, in chucks of 10 bytes, 100 bytes, etc, through 10 million bytes.
	This is accomplished by sending random bytes of data (in set quantities) to the server via Ajax request.
	Results are then displayed in a table by the speed test button.
	*/

	var boundary, transferdata, ajaxtime;
	boundary = '--aardvark';
	if (!data_length) {
		//Assigns an initial length of 10 bytes to our test data.
		data_length = 10;
	}
	if (data_length > 10000000) {
		//After final run, displays results in table.
		document.getElementById("python_speed_result").innerHTML = results + "</table>";
		return 1;
	}
	if (!results) {
		//Creates results table before the first test run.
		results = '<br /><table border="1"><tr><td><b>GUI<>Python SpeedTest</b></td><td colspan="4">Time (ms)</td></tr><tr><td align="right">Size (Bytes)</td><td>Python read</td><td>Python write</td><td>Python init</td><td>Ajax Roundtrip</td></tr>';
	}
	transferdata = [];
	transferdata[0] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'set_global_variable_from_socket' + '\n\r--' + boundary + '--\n\r';
	transferdata[1] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSPEEDTEST"\n\r\n\r' + randomString(data_length) + '\n\r--' + boundary + '--\n\r';
	transferdata[2] = '--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r';
	transferdata = transferdata.join("");
	ajaxtime = new Date().getTime();
	$.ajax({
		url: 'http://127.0.0.1:8083',
		type: 'POST',
		contentType: 'multipart/form-data; boundary=' + boundary,
		processData: false,
		data: transferdata,
		success: function (result) {
			result = result.substring(16);
			result = result.substring(data_length + 39);
			var now = new Date().getTime();
			setTimeout(function () {
				//Appends new results to previous (if any), increases size of test data by a factor of 10, and repeats the test run.
				results += '<tr><td align="right">' + data_length.toExponential(2) + '&nbsp;</td><td>' + ((result.split(',')).slice(0, 3)).join('</td><td>') + '</td><td>' + (now - ajaxtime) + '</td></tr>';
				data_length *= 10;
				test_pythontransferspeed(data_length, results);
			});
		}
	});
}

function execute_python() {
	"use strict";
	/*
	Ajax request to execute arbitrary python code taken from the 'python_input_textarea' element.
	Takes results from server and does the following:
		Displays code sent.
		Displays python results.
		Displays server variables available to user.
	*/

	var boundary, transferdata;
	boundary = '--aardvark';
	transferdata = [];
	transferdata[0] = '--' + boundary + '\n\rContent-Disposition: form-data; name="IDLSocket_ResponseFunction"\n\r\n\r' + 'execute_from_socket' + '\n\r--' + boundary + '--\n\r';
	transferdata[1] = '--' + boundary + '\n\rContent-Disposition: form-data; name="command"\n\r\n\r' + document.getElementById("python_input_textarea").value + '\n\r--' + boundary + '--\n\r';
	transferdata[2] = '--' + boundary + '\n\rContent-Disposition: form-data; name="terminator"\n\r\n\r' + 'die' + '\n\r--' + boundary + '--\n\r';
	transferdata = transferdata.join("");
	//alert(transferdata);
	$.ajax({
		url: 'http://127.0.0.1:8083',
		type: 'POST',
		contentType: 'multipart/form-data; boundary=' + boundary,
		processData: false,
		data: transferdata,
		success: function (result) {
			var consoleresult, varresult, i, j, newopt, select_length;
			//Removes variables from results and prints to appropriate textbox.
			consoleresult = [];
			consoleresult[0] = (result.substring(19).split('>Code>'))[0];
			consoleresult[1] = (result.substring(19).split('>Code>'))[2];
			consoleresult = consoleresult.join("");
			document.getElementById("python_response_textarea").value = consoleresult;
			//Separates variables from group.
			varresult = ((result.substring(19).split('>Code>'))[1]).split('>Var>');
			//Wipes previous variables, if any, from variable list textarea.
			select_length = document.getElementById('python_variable_list').length;
			for (i = 1; i < select_length; i++) {
				document.getElementById('python_variable_list').remove(1);
			}
			//Writes new variables to variable list textarea.
			alert(varresult[1]);
			for (j = 0; j < varresult.length; j++) {
				newopt = document.createElement('option');
				newopt.text = varresult[j];
				document.getElementById("python_variable_list").add(newopt, null);
			}
		}
	});
}

function undo(arg) {
	"use strict";
	/*
	Functions as an undo button for the text editor, for when Ctrl-Z won't work. (Ie. When editing the hdiode tree.)
	*/

	var index_number;
	arg.history_level++;
	//Next, find the index of the xml string that we want to access of the history array.
	index_number = arg.history.length - arg.history_level - 1;
	arg.xml_string = arg.history[index_number];
	//Here we remove the entry we're using from the history array.
	arg.history.splice(index_number, 1);
	//Tells the history function to keep the history level it's at.
	arg.keep_hlevel = true;
	arg.update_editor();
	arg.keep_hlevel = false;
	//Remove the newest entry to the history array, which was created by reverting the editor to its previous state.
	arg.history.pop();
	//Add back in the entry we just reverted the tree to, thus preserving the sequence order of the history array.
	arg.history.splice(index_number, 0, arg.xml_string);
	//If the history_level is now 1 (hence, it was zero), enable the redo button.
	if (arg.history_level === 1) {
		toggle_button("redo", false);
	}
	//Similarly, if the history level is now at the max value of the history array, disable the undo button.
	if ((arg.history.length - 1) === arg.history_level) {
		toggle_button("undo", true);
	}
}

function redo(arg) {
	"use strict";
	/*
	Functions as a redo button for the text editor, for when Ctrl-Y won't work. (Ie. When editing the hdiode tree.)
	*/

	var index_number;
	arg.history_level--;
	//Next, find the index of the xml string that we want to access of the history array.
	index_number = arg.history.length - arg.history_level - 1;
	arg.xml_string = arg.history[index_number];
	//Here we remove the entry we're using from the history array.
	arg.history.splice(index_number, 1);
	//Tells the history function to keep the history level it's at.
	arg.keep_hlevel = true;
	arg.update_editor();
	arg.keep_hlevel = false;
	//Remove the newest entry to the history array, which was created by reverting the editor to its previous state.
	arg.history.pop();
	//Add back in the entry we just reverted the tree to, thus preserving the sequence order of the history array.
	arg.history.splice(index_number, 0, arg.xml_string);
	//If the history_level is now 1 (hence, it was zero), enable the redo button.
	if (arg.history_level === 0) {
		toggle_button("redo", true);
	}
	//Similarly, if the history level is now at the max value of the history array, disable the undo button.
	if ((arg.history.length - 2) === arg.history_level) {
		toggle_button("undo", false);
	}
}

function darken_all() {
	"use strict";
	/*
	Changes XTSM colors from dark to light or vice versa.
	*/

	var button, css_code, css_length, colors, i, newHTML, j, thiscolor, R, G, B, ocolor, ncolor;
	button = document.getElementById("light_dark_button");
	// External css stylesheet.
	css_code = document.styleSheets[1].cssRules;
	css_length = css_code.length;
	colors = '';
	for (i = 0; i < css_length; i++) {
		colors += css_code[i].cssText;
	}
	alert(colors); //Got this far, reads codemirror code. Values are in rgb().
	colors = colors.split('#');
	newHTML = colors[0];
	for (j = 1; j < colors.length; j++) {
		thiscolor = '#' + colors[j].substring(0, 6);
		R = hexToR(thiscolor);
		G = hexToG(thiscolor);
		B = hexToB(thiscolor);
		ocolor = rgbToHsv(R, G, B);
		if (button.value == 'Dark Room Color') {
			ncolor = hsvToRgb(ocolor[0], ocolor[1], (100 - 0.6 * ocolor[2]));
		} else {
			ncolor = hsvToRgb(ocolor[0], ocolor[1], (166.7 - 1.667 * ocolor[2]));
		}
		newHTML += '#' + rgbToHex(ncolor[0], ncolor[1], ncolor[2]) + colors[j].substring(6);
	}
	if (button.value == 'Dark Room Color') {
		newHTML += "\n input{background:#333333;color:#ffffff;border:#333333} \n body{background:#666666; color:#ffffff} a{color:#ffffff}";
	} else {
		newHTML += "\n input{background:#ffffff;color:#000000;} \n body{background:#ffffff; color:#000000}";
	}
	document.getElementById('stylesheet0').innerHTML = newHTML;
	if (button.value == 'Dark Room Color') {
		button.value = 'Bright Room Color';
	} else {
		button.value = 'Dark Room Color';
	}
}

function search_dom(termfield, arg) {
	"use strict";
	/*
	Takes as input a text box object (termfield) and an hdiode tree element (arg).
	Turns XTSM (from hdiode tree) into a DOM object and searches for the value of the termfield.
	Displays the results underneath the termfield. Results include:
		A button to delete results.
		A button to jump to the relevant element. (JUMP FUNCTION IS CURRENTLY UNOPERATIONAL)
	*/

	//This parses the existing XML code into a DOM object
	var parser2, xmlDoc2, search_result, results_list_super_div, results_list_div, delicon, ital, results_list, result, list_item, jump_icon, match_text, underscored;
	//Create new DOM object and use it to parse XTSM from arg.
	parser2 = new DOMParser();
	xmlDoc2 = parser2.parseFromString(arg.editor.getValue(), "text/xml");
	//Search the XTSM for the value of termfield.
	search_result = xmlDoc2.evaluate("//*[text()[contains(.,'" + termfield.value + "')]]", xmlDoc2, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
	//Find the search results div element and add a new result node to it.
	results_list_super_div = document.getElementById('search_results_div');
	results_list_div = results_list_super_div.appendChild(document.createElement('div'));
	delicon = results_list_div.appendChild(document.createElement("img"));
	//Create delete button for the new result node.
	delicon.setAttribute('src', '/images/seqicon_item_delete.png');
	delicon.setAttribute('height', '12px');
	delicon.setAttribute('title', 'Delete results');
	delicon.setAttribute('onclick', 'javascript:this.parentNode.parentNode.removeChild(this.parentNode);');
	//List the term that was searched for.
	results_list_div.appendChild(document.createTextNode("  Results for '"));
	ital = results_list_div.appendChild(document.createElement("i"));
	ital.appendChild(document.createTextNode(termfield.value));
	results_list_div.appendChild(document.createTextNode("':"));
	//Create a new node to list the search results.
	results_list = results_list_div.appendChild(document.createElement('ul'));
	results_list.setAttribute("style", "list-style-type:none");
	//For each search result...
	result = search_result.iterateNext();
	if (result === null) {
		//Create a new node.
		list_item = results_list.appendChild(document.createElement('li'));
		//List lack of result.
		list_item.appendChild(document.createTextNode('No results for ' + termfield.value + ' were found.'));
	} else {
		while (result) {
			//Create a new node.
			list_item = results_list.appendChild(document.createElement('li'));
			//Create a jump button.
			jump_icon = list_item.appendChild(document.createElement('img'));
			jump_icon.setAttribute('src', '/images/seqicon_go.png');
			jump_icon.setAttribute('height', '18px');
			jump_icon.setAttribute('title', 'Jump to this element');
			//--Jump suit disabled--
			//jump_icon.setAttribute('onclick', 'javascript:searchjump(\'' + generate_name_for_element(result.parentNode) + '\');this.setAttribute("src" , "images/seqicon_gone.png")');
			//Add in a search result.
			match_text = result.childNodes[0].nodeValue.split(termfield.value);
			list_item.appendChild(document.createTextNode(result.parentNode.nodeName + " : " + result.nodeName + " = '" + match_text[0]));
			//Underline the searched term in the listed result.
			underscored = list_item.appendChild(document.createElement('u'));
			underscored.appendChild(document.createTextNode(termfield.value));
			list_item.appendChild(document.createTextNode(match_text[1] + "'"));
			//Continue loop.
			result = search_result.iterateNext();
		}
	}
}

function Hdiode_code_tree(html_div, sources) {

// This object implements a linked-pair of text/code-editor (using codeMirror) 
// and HTML xml tree-editor. The HTML representation of the tree is built using
// an XSL transform which can be dynamically loaded/reloaded.  
// Optionally, an XSD schema can also be loaded (not yet used for anything).
// Both editor and tree are inserted into the HTML DOM at the provided html_div.

    function create_container(html_div) {
    // creates child divisions to house title (topline), codemirror, and tree. 
    // Creates textarea to later be converted into codemirror editor.
        this.html_div_title = html_div.appendChild(document.createElement('div'));
        this.html_div_title.setAttribute("class", "hdiode_xml_tree_titlediv");
        this.html_div_title.appendChild(document.
            createElement('span')).appendChild(document.createTextNode('XML Editor'));
        this.html_div_cm = html_div.appendChild(document.createElement('div'));
        this.html_div_cm.setAttribute("class", "hdiode_xml_tree_cmdiv");
        this.html_div_tree = html_div.appendChild(document.createElement('div'));
        this.html_div_tree.setAttribute("class", "hdiode_xml_tree_treediv");
        this.textarea = this.html_div_cm.appendChild(document.createElement('textarea'));
        this.textarea.value = this.xml_string;
    }
    this.create_container = create_container;

    function xmltoString(elem) {
        var serialized, serializer;
        try {
            serializer = new XMLSerializer();
            serialized = serializer.serializeToString(elem);
        } catch (e) { serialized = elem.xml; }
        return serialized;
    }

    function refresh_tree() {
        //builds HTML tree by applying XSL to XML.
        var xslparser, docparser, xml, xsltProcessor, ex, exs;
        if (!this.xml_string) { return; }
        if (!this.xsl_string) { return; }
        xslparser = new DOMParser();
        // -> would be good to avoid reparsing the xsl everytime.
        if (!(typeof this.xslDoc === 'object')) {
            this.xslDoc = xslparser.parseFromString(this.xsl_string, "text/xml");
        }
        docparser = new DOMParser();
        xml = docparser.parseFromString(this.xml_string, "text/xml");
        xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(this.xslDoc);
        ex = xsltProcessor.transformToFragment(xml, document);
        exs = xmltoString(ex);
        this.html_div_tree.appendChild(ex);
        this.html_div_tree.innerHTML = exs;
        // -> need to bind update methods here - 
        // must require xsl routine to tag inputs for binding.
        this.bind_events();
    }
    this.refresh_tree = refresh_tree;

    function toggleProp_update_editor(event) {
        // toggles an element between expanded and collapsed view by rewriting XML, 
        // and re-generating entire tree.  Retrieve XPATH to generating XML element 
        // from first parent division's gen_id property
        var change_prop, elmpath, docparser, xml, target, newval, temp, targets, i;
        change_prop = event.data.args[0].replace(/["']{1}/gi, "");
        docparser = new DOMParser();
        xml = docparser.parseFromString(event.data.container.xml_string, "text/xml");
        target = event.data.container.event_get_elm(event, xml);
        newval = ($(target).attr(change_prop) === "1") ? '0' : '1';
        if ($(target).attr(change_prop) === "1") {
            $(target).attr(change_prop, "0");
        } else {
            (temp = $(target).attr(change_prop, "1"));
        }
        if (event.ctrlKey) {
            //ctrl-toggle applies to children
            elmpath = event.data.container.event_get_elmpath(event);
            targets = xml.evaluate(elmpath + "/*", xml, null,
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (i = 0; i < targets.snapshotLength; i += 1) {
                $(targets.snapshotItem(i)).attr(change_prop, newval);
            }
        }
        if (event.altKey) {
            //alt-toggle applies to all decendants
            elmpath = event.data.container.event_get_elmpath(event);
            targets = xml.evaluate(elmpath + "//*", xml, null,
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (i = 0; i < targets.snapshotLength; i += 1) {
                $(targets.snapshotItem(i)).attr(change_prop, newval);
            }
        }
        event.data.container.xml_string = xmltoString(xml);
        event.data.container.update_editor();
        // (tree is automatically refreshed by onchange event of codemirror editor)
    }
    this.toggleProp_update_editor = toggleProp_update_editor;

    function event_get_elmpath(event) {
    // given an event, this returns the xpath to the corresponding xml element that generated the control
        var elmpath;
        elmpath = $(event.target).parents("div:first").get(0).
            getAttribute('gen_id');
        if (elmpath.substr(elmpath.length - 2, 2) === '__') {
            if (event.target.name) {
                elmpath += event.target.name;
            } else {
                elmpath = elmpath.substr(0, elmpath.length - 2);
            }
        }
        elmpath = elmpath.split('divtree__')[1].replace(/__/g, "]/").
            replace(/_/g, "[") + "]";
        return elmpath;
    }
    this.event_get_elmpath = event_get_elmpath;

    function event_get_elm(event, xml) {
        // given an event, this returns the xml object that generated the control;
        // (it safely assumes there is only one such element)
        var elmpath, target;
        elmpath = event.data.container.event_get_elmpath(event);
        target = xml.evaluate(elmpath, xml, null, XPathResult.
            UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
        return target;
    }
    this.event_get_elm = event_get_elm;

    function updateElement_update_editor(event) {
        // toggles an element between expanded and collapsed view by 
        // rewriting XML, and re-generating entire tree
        // retrieve XPATH to generating XML element from 
        // first parent division's gen_id property
        //var elmpath, docparser, xml, target;
		var elmpath, docparser, xml, target;
        elmpath = $(event.target).parents("div:first").get(0).
            getAttribute('gen_id');
        if (elmpath.substr(elmpath.length - 2, 2) === '__') {
            elmpath += event.target.name;
        }
        elmpath = elmpath.split('divtree__')[1].replace(/__/g, "]/").
            replace(/_/g, "[") + "]";
        docparser = new DOMParser();
        xml = docparser.parseFromString(event.data.container.xml_string, "text/xml");
        target = xml.evaluate(elmpath, xml, null, XPathResult.
            UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
        if (target.firstChild) { target.firstChild.data = event.target.value; } else { target.appendChild(xml.createTextNode(event.target.value)); }
        event.data.container.xml_string = xmltoString(xml);
        event.data.container.update_editor();
        // (tree is automatically refreshed by onchange event of codemirror editor)
    }
    this.updateElement_update_editor = updateElement_update_editor;

    function autocomplete(event) {
        var docparser, tevent, xml, res;//  res, xml;
        //first exit if the keypress is not ctrl-right- or ctrl-left-arrow
        tevent = event;
        if (!(event.ctrlKey)) { return; }
        if ((event.keyCode !== 39) && (event.keyCode !== 37)) { return; }
        // this event handler autocompletes by looking up values 
        // from xml dom when uparrow is pressed.
        // check if this input was the last pressed 
        // autocomplete, if not, reset index to zero
        if (event.data.container.autocomplete_lastfield !==
                $(event.target).attr('name')) {
            event.data.container.autocomplete_lastfield = $(event.target).attr('name');
            event.data.container.autocomplete_root = $(event.target).attr('value');
            event.data.container.autocomplete_index = 0;
        } else {
            if (event.keyCode === 39) { event.data.container.autocomplete_index += 1; }
            if (event.keyCode === 37) { event.data.container.autocomplete_index -= 1; }
        }
        docparser = new DOMParser();
        xml = docparser.parseFromString(event.data.container.xml_string, "text/xml");
        res = xml.evaluate(event.data.args[0].split("'")[1].replace('$', '"' + event.data.container.autocomplete_root + '"'), xml, null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        // take modulus of index to reference hits, insert them into field
        if (res.snapshotLength > 1) {
            $(event.target).attr('value', $(res.snapshotItem(
                event.data.container.autocomplete_index - Math.floor(
                    event.data.container.autocomplete_index / res.snapshotLength
                ) * res.snapshotLength
            )).text());
        } else { $(event.target).attr('value', $(res.snapshotItem(0)).text()); }
    }
    this.autocomplete = autocomplete;

    function modifyElement_update_editor(event) {
		var docparser, xml, elm;
        docparser = new DOMParser();
        xml = docparser.parseFromString(event.data.container.xml_string, "text/xml");
        elm = event.data.container.event_get_elm(event, xml);
        if (event.data.args[0] === "'delete'") {
            elm.parentElement.removeChild(elm);
        } else if (event.data.args[0] === "'move'") {
        } else if (event.data.args[0] === "'clone'") {
            //THIS DOESN'T WORK YET
			var alert;
            alert('cloning');
            elm.parentElement.insertBefore(elm, elm);
        }
        event.data.container.xml_string = xmltoString(xml);
        event.data.container.update_editor();
    }
    this.modifyElement_update_editor = modifyElement_update_editor;

    function bind_events() {
        // this searches the html tree looking for xtsm_viewer_event attributes 
        // their value should be of the form 
        // eventType:handlerFunctionName(arg1,arg2...)
        // it then attaches the handler (should be a method of this object) 
        // to the HTML event
        var bind_targets, next_target, eventtype, handler_name, handler_args,
            that, thisevent, allevents, j;
        bind_targets = document.evaluate('//*[@xtsm_viewer_event]', document, null,
            XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
        next_target = bind_targets.iterateNext();
        while (next_target) {
            // this parses the event type and handler function 
            // from the xtsm_viewer_event attribute
            // multiple events should be split by semicolons
            //var thisevent=next_target.getAttribute('xtsm_viewer_event').split(';')[0];
            allevents = next_target.getAttribute('xtsm_viewer_event').split(';');
            for (j = 0; j < allevents.length - 1; j += 1) {
                thisevent = allevents[j];
                eventtype = thisevent.split(':')[0];
                if (eventtype.substr(0, 2) === 'on') {
                    eventtype = eventtype.substr(2);
                }
                handler_name = thisevent.
                    split(':')[1].split('(')[0];
                handler_args = thisevent.
                    split(':')[1];
                handler_args = handler_args.substring(handler_args.indexOf("(") + 1);
                handler_args = handler_args.substring(0, handler_args.lastIndexOf(")")).match(/(?!;| |$)([^";]*"[^"]*")*([^";]*[^ ";])?/g); //split(',');
//                if (handler_name === "autocomplete") {alert(handler_args ); }
                if (typeof this[handler_name] === 'function') {
                    //this[handler_name].apply(this, handler_args);
                    //this line does the event-binding
                    that = this;
                    $(next_target).on(eventtype, null,
                        { container: this, args: handler_args }, this[handler_name]);
                }
            }
            next_target = bind_targets.iterateNext();
        }
    }
    this.bind_events = bind_events;

    function update_editor() {
		this.editor.setValue(this.xml_string);
		return;
	}
    this.update_editor = update_editor;

    function load_file(filename, target) {
        var thatt = this;
        $.get(filename, function (source) {
            if (target === 'xml_string') {
                thatt.xml_string = source;
                thatt.update_editor();
                return source;
            }
            if (target === 'xsl_string') {
                thatt.xsl_string = source;
                return source;
            }
            if (filename.split(/\.xml|\.xsd|\.xtsm/).length > 1) {
                thatt.xml_string = source;
                thatt.update_editor();
                return source;
            }
            if (filename.split(/\.xs|\.xsl/).length > 1) {
                thatt.xsl_string = source;
                return source;
            }
        }, 'text');
    }
    this.load_file = load_file;

	function add_to_history(xml_string) {
		/*Adds an element to the history array.
		If undo/redo triggers this, this.keep_hlevel will be true. This stores the most recent history into a buffer.
		If not triggered by undo/redo, the.keep_hlevel will be false. This resets the history_level index and,
			if the buffer is storing an xml string, places it before the next change. It then sets the buffer as an empty string.
		In either case, the change which triggered this function will then be added onto the end of the history array.
		Finally, the history array is shortened (via FIFO) to the max size value.
		*/

		//Checks whether or not this was triggered by undo/redo buttons.
		if (this.keep_hlevel === false) {
			//If not, check if buffer contains the empty string. If not, get buffer value, reset buffer, and reset history level.
			if (this.history_buffer !== '') {
				this.history.push(this.history_buffer);
				this.history_buffer = '';
				this.history_level = 0;
				//Disable redo, since we've now stopped messing with history, and enable undo (in case it was disabled).
				toggle_button("undo", false);
				toggle_button("redo", true);
			}
		} else if (this.keep_hlevel !== true) {
			alert(this.keep_hlevel);
		} else {
			this.history_buffer = xml_string;
		}
		//Add a new element to the end of the history array.
		this.history.push(xml_string);
		//If the history array is now longer than the specified history size, remove the first element.
		while (this.history.length > this.history_max_size) {
			this.history.shift();
		}
	}
	this.add_to_history = add_to_history;

    this.xml_string = sources.xml_string;
    this.xsl_string = sources.xsl_string;
    this.xsd_string = sources.xsd_string;

    if (html_div) { this.create_container(html_div); }

	this.history = [];
	this.history_max_size = document.getElementById('undo_levels').value;
	this.history_level = 0;
	this.keep_hlevel = false;
	this.history_buffer = '';

    var that = this;
    if (this.textarea) {
        this.editor = CodeMirror.fromTextArea(this.textarea,
            { mode: "text/html", gutter: "True", lineNumbers: "True",
                gutters: ["note-gutter", "CodeMirror-linenumbers"],
                linewrapping: "True", autoCloseTags: true });
        this.editor.on("change", function () {
            that.xml_string = that.editor.getValue();
			that.add_to_history(that.xml_string);
            that.refresh_tree();
            return;
        });
    }
    this.editor.setGutterMarker(0, "note-gutter", document.createTextNode("start>"));

    return this;


}

function main() {
	"use strict";
	/*
	Responsible for all functionality of the GUI:
		Creates a new Hdiode code tree.
		Houses function calls for html elements' dynamic functions.
	*/

	//Creates new hdiode tree
	var arg;
	arg = new Hdiode_code_tree(document.getElementById('Create_Tree'), {xml_string: '<none>', xsl_string: '<none>', xsd_string: 'ohthehuemanatee'});
	arg.load_file("transforms/default.xslt", 'xsl_string');
	arg.load_file("sequences/default.xtsm", 'xml_string');

	/*Controls html page elements outside of the code tree*/
	//File Operations
	document.getElementById("file_menu").onclick = function () {toggle_menu("file_menu", "file_operations"); };
	document.getElementById("load").onclick = function () {load_new_file(arg); };
	document.getElementById("save_file").defaultValue = default_save_name();
	document.getElementById("save").onclick = function () {save_file(arg); };
	document.getElementById("refresh").onclick = function () {refresh(arg); };
	document.getElementById("refresh").onload = function () {populate_folders(); };
	//Parser
	document.getElementById("parser_menu").onclick = function () {toggle_menu("parser_menu", "parser_operations"); };
	document.getElementById("parse_preview_button").onclick = function () {does_nothing(); }; //DNWY [Does Not Work Yet] (Obviously)
	document.getElementById("post_xtsm_button").onclick = function () {post_active_xtsm(arg); };
	document.getElementById("retrieve_xtsm_button").onclick = function () {retrieve_active_xtsm(arg); };
	document.getElementById("disable_python_socket_button").onclick = function () {disable_python_socket(); };
	document.getElementById("launch_python_button").onclick = function () {launch_python(); };
	document.getElementById("test_pythontransferspeed_button").onclick = function () {test_pythontransferspeed(); };
	//Python Console
	document.getElementById("python_menu").onclick = function () {toggle_menu("python_menu", "python_operations"); };
	document.getElementById("python_submit_code_button").onclick = function () {execute_python(); };
	//History
	document.getElementById("history_menu").onclick = function () {toggle_menu("history_menu", "history_operations"); };
	document.getElementById("undo").onclick = function () {undo(arg); };
	document.getElementById("redo").onclick = function () {redo(arg); };
	document.getElementById("undo_levels").onchange = function () {arg.history_max_size = document.getElementById("undo_levels").value; }; //Sets the history buffer size to this field's value.
	//Display and Help
	document.getElementById("display_menu").onclick = function () {toggle_menu("display_menu", "display_operations"); };
	document.getElementById("light_dark_button").onclick = function () {darken_all(); }; //DNWY
	document.getElementById("show_help").onclick = function () {does_nothing(); }; //DNWY (Obviously)
	document.getElementById("font_type").onblur = function () {does_nothing(); }; //DNWY (Obviously)
	//Search Tools
	document.getElementById("search_menu").onclick = function () {toggle_menu("search_menu", "search_operations"); };
	document.getElementById("search_input").onfocus = function () {document.getElementById("search_input").value = ''; }; //Clears text field upon focus.
	document.getElementById("search_input").onchange = function () {search_dom(document.getElementById("search_input"), arg); };

}
