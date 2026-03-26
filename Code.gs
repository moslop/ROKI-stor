const SPREADSHEET_ID = '1DLFz_feQtgoASlaWfTgraRQiuuXUqbe5cvrmYZHh1Sg';
const SHEET_NAME = 'Products';
const HEADERS = ['id', 'name', 'price', 'oldPrice', 'qty', 'img', 'cat', 'badge', 'desc', 'sizes'];

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let action = null;
    let data = {};

    // Prioritize query param for action, helps routing
    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }

    if (e && e.postData && e.postData.contents) {
      try {
        const payload = JSON.parse(e.postData.contents);
        // Keep the payload data, but query param action wins
        action = action || payload.action;
        data = payload;
      } catch (err) {
        console.error('Error parsing JSON body:', err);
        // If query param action exists, we can still proceed
      }
    }

    if (!action) throw new Error('لم يتم تحديد إجراء (Action is missing)');

    if (action === 'getProducts') {
      return getProducts();
    } else if (action === 'saveProduct') {
      if (!data.product) throw new Error('بيانات المنتج مفقودة');
      return saveProduct(data.product);
    } else if (action === 'deleteProduct') {
      const id = data.id || (e.parameter ? e.parameter.id : null);
      if (!id) throw new Error('معرف المنتج مفقود');
      return deleteProduct(id);
    } else {
      throw new Error('إجراء غير معروف: ' + action);
    }
  } catch (err) {
    console.error('Final handleRequest error:', err.toString());
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function getProducts() {
  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const products = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return jsonResponse({ status: 'success', products: products });
}

function saveProduct(product) {
  if (!product) throw new Error('No product data provided');
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const id = String(product.id || new Date().getTime());

  const rowData = headers.map(h => product[h] || '');

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === id) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return jsonResponse({ status: 'success', id: id });
}

function deleteProduct(id) {
  if (!id) throw new Error('No ID provided');
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ status: 'success', message: 'Product deleted' });
    }
  }
  return jsonResponse({ status: 'error', message: 'Product not found' });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
