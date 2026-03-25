var SPREADSHEET_ID = '1DLFz_feQtgoASlaWfTgraRQiuuXUqbe5cvrmYZHh1Sg';

function doGet(e) {
  return handleResponse({ success: true, message: 'API is running' });
}

function doPost(e) {
  try {
    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return handleResponse({ error: 'No data provided' });
    }

    var action = data.action;
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    ensureSheets(sheet);

    if (action === 'getProducts') {
      return handleResponse({ products: getRows(sheet, 'Products') });
    } else if (action === 'saveProduct') {
      return handleResponse(saveProduct(sheet, data.product));
    } else if (action === 'deleteProduct') {
      return handleResponse(deleteRow(sheet, 'Products', data.id));
    } else if (action === 'getOrders') {
      return handleResponse({ orders: getRows(sheet, 'Orders') });
    } else if (action === 'saveOrder') {
      return handleResponse(saveOrder(sheet, data.order));
    } else if (action === 'updateOrderStatus') {
      return handleResponse(updateStatus(sheet, 'Orders', data.id, data.status));
    }

    return handleResponse({ error: 'Invalid action' });
  } catch (error) {
    return handleResponse({ error: error.toString() });
  }
}

function handleResponse(response) {
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheets(ss) {
  var sheets = ['Products', 'Orders'];
  var headers = {
    'Products': ['id', 'name', 'price', 'oldPrice', 'qty', 'img', 'cat', 'badge', 'nameEn', 'nameFr', 'desc', 'descEn', 'descFr', 'sizes'],
    'Orders': ['id', 'date', 'name', 'phone', 'address', 'items', 'total', 'status', 'notes']
  };

  sheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers[name]);
    }
  });
}

function getRows(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function saveProduct(ss, product) {
  var sheet = ss.getSheetByName('Products');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rowIndex = -1;

  if (product.id) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(product.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var rowValues = headers.map(function(h) {
    return product[h] || '';
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    product.id = Utilities.getUuid();
    rowValues[0] = product.id;
    sheet.appendRow(rowValues);
  }
  return { success: true, product: product };
}

function deleteRow(ss, sheetName, id) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Row not found' };
}

function saveOrder(ss, order) {
  var sheet = ss.getSheetByName('Orders');
  var headers = sheet.getDataRange().getValues()[0];
  order.id = 'ORD-' + Math.floor(Date.now() / 1000);
  order.date = new Date().toLocaleString();
  order.status = 'جديد';

  var rowValues = headers.map(function(h) {
    return order[h] || '';
  });

  sheet.appendRow(rowValues);
  return { success: true, order: order };
}

function updateStatus(ss, sheetName, id, status) {
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var statusCol = headers.indexOf('status') + 1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, statusCol).setValue(status);
      return { success: true };
    }
  }
  return { error: 'Order not found' };
}
