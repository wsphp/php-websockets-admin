var ws = false;
var timer = false;

function Reconnect()
{	if(timer) clearTimeout(timer);
	timer = setTimeout(_reconnect, 1000);
	document.getElementById("admin").innerHTML = "C O N N E C T I N G . . .";
	document.getElementById("status").style.background="#AAA";
	if(ws) ws.close();
}

function _control()
{	return document.getElementById("control").value;
}

function _reconnect()
{	var server=false;
	server = document.getElementById("server").value;
	if(!server || !server.length)
	{	server = uriParam("server");
		if(!server || !server.length)
		{	server = location.host;
			if(!server || !server.length) server="127.0.0.1:30403";
		}
		document.getElementById("server").value = server;
		if(uriParam("control")) document.getElementById("control").value = uriParam("control");
		if(uriParam("password")) document.getElementById("password").value = uriParam("password");
	}
	document.getElementById("status").style.background="#A00";
	ws = new WebSocket("ws://"+server+"/wsphp");
	ws.onopen    = function(evt) { onOpen(evt);    };
	ws.onerror   = function(evt) { onClose(evt);   };
	ws.onclose   = function(evt) { onClose(evt);   };
	ws.onmessage = function(evt) { onMessage(evt); };
}

function onOpen(evt)
{	document.getElementById("status").style.background="#0A2";
	ws.send(document.getElementById("control").value+"=authenticate&password="+document.getElementById("password").value+"&output_format=json");
}

function onClose(evt)
{	document.getElementById("status").style.background="#F00";
	setTimeout(Reconnect, 1000);
}

function onMessage(evt)
{	try
	{	var j = JSON.parse(evt.data);
		if(window.console) console.log(j);
		if(j[_control()])
		{	if("authenticate" == j[_control()].request) OnMessage_Authenticate(j[_control()]);
			if("get_endpoints" == j[_control()].request) OnMessage_Endpoints(j[_control()]);
		}
	} catch(e)
	{	document.getElementById("status").style.background="#A0A";
		if(window.console) console.log("JSON Error("+e+"): "+evt.data);
	}
}

function OnMessage_Authenticate(json)
{	ws.send(document.getElementById("control").value+"=get_endpoints");
}

function onSend(sid)
{	var text = "Hello, world!";
	ws.send(document.getElementById("control").value+"=send_to&endpoint="+sid+"&message="+text);
	return false;
}

function onDisconnect(sid)
{	ws.send(document.getElementById("control").value+"=disconnect&endpoint="+sid);
	return false;
}

function OnMessage_Endpoints(json)
{	var i, j, s;

	if(json.endpoint_list && json.endpoint_list_fields)
	{	s = "<table border=1 cellpading=0 cellspacing=0><tr class=header>";
		for(i in json.endpoint_list_fields) s += "<td>"+json.endpoint_list_fields[i]+"</td>";
		s += "<td>Actions</td></tr>";
		for(i in json.endpoint_list)
		{	s += "<tr>";
			for(j in json.endpoint_list[i]) s += "<td>"+json.endpoint_list[i][j]+"</td>";
			if(json.endpoint_this == json.endpoint_list[i][0]) s += "<td>&mdash;</td>";
			else
			{	s += "<td><a href=# onclick=\"return onSend('"+json.endpoint_list[i][0]+"')\">send</a> &mdash; ";
				s += "<a href=# onclick=\"return onDisconnect('"+json.endpoint_list[i][0]+"')\">disconnect</a>";
				s += "</td>";
			}
			s += "</tr>";
		}
		s += "</table>";
		document.getElementById("admin").innerHTML = s;
		return;
	}
}

function uriParam(name)
{	var url = location.href;
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( url );
	return results == null ? null : results[1];
}
