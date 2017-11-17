function showScore(id, newValue){
  document.getElementById(id+"_score").innerHTML=newValue;
}

//duplicate("product_form_org", "product_zone")
function duplicate(obj, parent) {
  let clone = document.getElementById(obj).cloneNode(true); // "deep" clone
  clearFieldsWithDOM(clone);
  clone.id = makeid(6); // there can only be one element with an ID
  //clone.onclick = duplicate; // event handlers are not cloned
  let removeButton = document.createElement("INPUT");
  removeButton.type = "button";
  removeButton.onclick = function(){id=clone.id;document.getElementById(id).parentElement.removeChild(document.getElementById(id));};
  removeButton.value = "remove";
  clone.insertBefore(removeButton, clone.firstChild);
  //input(type="button" onclick="this.parentElement.removeChild(this)" value="移除這項產品") 
  document.getElementById(parent).appendChild(clone);
  return clone.id;
}

//clearFieldsWithDOM(document.getElementById("product_form_org"));
function clearFieldsWithDOM(obj) {
    if (obj.nodeName=="INPUT" && obj.type=="text")
        obj.value = "";
    if (obj.nodeName=="TEXTAREA")
        obj.value = "";
    for(let i=0; i<obj.children.length;i++)
        clearFieldsWithDOM(obj.children[i]);
}

function ns(str) {
  if (str==undefined)
    return "";
}
function s2n(str) {
  if (str.trim()=="")
    return undefined;
}
function makeid(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

checkRegex = function(type, data){  //check helper
    regexArray = {};
    regexArray["hostname"] = new RegExp(/^[a-zA-Z0-9\-_\.]*$/);
    regexArray["url"] = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
    regexArray["filepath"] = new RegExp(/^\/([a-zA-Z0-9\_\-\.]+\/?)*$/);
    regexArray["filename"] = new RegExp(/^[a-zA-Z0-9_\-\.]+$/);
    regexArray["slidename"] = new RegExp(/^\/(\S+)\/(\d+)\.(.*)$/);
    regexArray["slidefilename"] = new RegExp(/^(\d+)\.([a-zA-Z0-9]+)(\.gz)?$/); 

    regexArray["user"] = new RegExp(/^[a-zA-Z0-9\-_\.]*$/);
    regexArray["email"] = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

    regexArray["num"] = new RegExp(/^[0-9]+$/);
    regexArray["id"] = new RegExp(/^[a-zA-Z0-9\_\-\.]+$/); //MongoDB UUID
    regexArray["csv"] = new RegExp(/^[a-zA-Z0-9\_\-\.,<>'"]+$/);
    regexArray["ip"] = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/);
    regexArray["ipv4"] = new RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
    regexArray["ipv6"] = new RegExp(/^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/);
    regexArray["passwd"] = new RegExp(/^.+$/);
    regexArray["key"] = new RegExp(/^[a-zA-Z0-9\_\-\.]+$/); //MongoDB UUID
    regexArray["cef"] = new RegExp(/^CEF:\d+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|.*$/); 
    regexArray["cef_inside"] = new RegExp(/^.*CEF:\d+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|[^\|]+\|.*$/); 

    if (type=="json"){
      try {
        JSON.parse(data);
        return true;
      } catch (e) {
        return false;
      }
    }
    if (regexArray[type]==undefined)
        return false;
    return regexArray[type].test(data);
};

$(function () {
  $('#datepicker_start').datepicker({dateFormat: 'yy-mm-dd'});
  $('#datepicker_end').datepicker({dateFormat: 'yy-mm-dd'});
  $('#datepicker_shipping_expect_at').datepicker({dateFormat: 'yy-mm-dd'});
});