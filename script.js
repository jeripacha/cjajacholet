// --- LÓGICA DE JAVASCRIPT ---

const STORAGE_KEY = 'pachaSunsetAllInputs';

// Se establece el 'type' para diferenciar el control:
const products = [
    // --- Productos de INVENTARIO (Botellas / Paquetes) --- (MANTENIDOS)
    { name: "Singani Parrales", price: 320, type: 'inventory' }, 
    { name: "Flor de Caña 7 Años", price: 280, type: 'inventory' },
    { name: "Vodka 1825", price: 250, type: 'inventory' },
    { name: "Whisky 750ml", price: 350, type: 'inventory' },
    { name: "Tequila José Cuervo", price: 300, type: 'inventory' },
    { name: "Fernet Branca Botella", price: 290, type: 'inventory' },
    { name: "Jager Botella", price: 150, type: 'inventory' },
    { name: "Viuda Descalza", price: 200, type: 'inventory' },
    { name: "Gin Andino", price: 400, type: 'inventory' },
    { name: "Gin Frutilla", price: 310, type: 'inventory' },
    { name: "Gin Frutos del Bosque", price: 180, type: 'inventory' },
    { name: "Gin Amazónico", price: 25, type: 'inventory' },
    { name: "Cerveza Corona", price: 500, type: 'inventory' },
    { name: "Cerveza Huari", price: 30, type: 'inventory' },
    { name: "Coca-Cola 2L", price: 20, type: 'inventory' },
    { name: "Schweppes 1.5", price: 18, type: 'inventory' },
    { name: "Agua Pacha", price: 12, type: 'inventory' },
    { name: "Agua Tónica", price: 600, type: 'inventory' },
    { name: "Camel 2 Click Grande", price: 290, type: 'inventory' },
    { name: "Camel 2 Click Pequeño", price: 120, type: 'inventory' },
    { name: "Camel 1 Click Grande", price: 270, type: 'inventory' },
    { name: "Camel 1 Click Pequeño", price: 550, type: 'inventory' },
    { name: "Senz Arándano", price: 700, type: 'inventory' },
    { name: "Simba Pomelo", price: 18, type: 'inventory' },
    { name: "Fernet Bhuero", price: 50, type: 'inventory' },

    // --- Productos de VENTA POR UNIDAD (Shots / Vasos) --- (MANTENIDOS)
    { name: "Shot Jager", price: 18, type: 'unit-sale' }, 
    { name: "Jagerboom", price: 30, type: 'unit-sale' }, 
    { name: "Vaso de Fernet", price: 25, type: 'unit-sale' }, 
    { name: "Vaso de Singani", price: 20, type: 'unit-sale' },
    { name: "Vaso de Ron", price: 22, type: 'unit-sale' },
    { name: "Vaso de Gin", price: 28, type: 'unit-sale' },
    { name: "Vaso de Vodka", price: 20, type: 'unit-sale' },
];

// Precios clave para el análisis de discrepancia (de menor a mayor)
// Se usa el precio más bajo de cada rango para las sugerencias.
const keyPrices = [
    { name: "cambio no entregado/faltante", price: 5 }, // Bs 5 (cambio)
    { name: "Shot Jager", price: 18 }, // Bs 18 
    { name: "Vaso de Singani/Vodka", price: 20 }, // Bs 20 
    { name: "Vaso de Ron", price: 22 }, // Bs 22
    { name: "Vaso de Fernet", price: 25 }, // Bs 25
    { name: "Vaso de Gin", price: 28 }, // Bs 28
    { name: "Jagerboom", price: 30 }, // Bs 30
].sort((a, b) => a.price - b.price); 

let reportData = []; 
let globalTotalRevenue = 0;
let physicalCashInput = 0; // Almacena el valor de caja física

/**
 * Guarda el valor de un campo específico en localStorage, incluyendo el campo de caja física.
 */
function saveInputData(index, type, value) {
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

        // Lógica para el campo de caja física
        if (index === 'cash') {
            savedData['cash'] = savedData['cash'] || {};
            savedData['cash'][type] = value;
        } else {
            // Lógica para los inputs de productos
            if (!savedData[index]) {
                savedData[index] = {};
            }
            savedData[index][type] = value; 
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    } catch (e) {
        console.error("Error guardando datos en localStorage:", e);
    }
}

/**
 * Carga todos los datos de los inputs guardados en localStorage.
 */
function loadAllInputData() {
    try {
        const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return savedData || {};
    } catch (e) {
        console.error("Error cargando datos de localStorage:", e);
        return {};
    }
}

/**
 * Limpia el contenido del reporte y deshabilita el botón de reporte.
 */
function clearReportView() {
    // ... (Tu función original clearReportView)
    const reportList = document.getElementById('report-units-list');
    const totalRevenueDisplay = document.getElementById('total-revenue-display');
    const totalRevenueTheoretical = document.getElementById('total-revenue-display-theoretical');
    const totalPhysicalDisplay = document.getElementById('total-physical-display');
    const cuadreResult = document.getElementById('cuadre-result');
    const analysisDiv = document.getElementById('discrepancy-analysis');
    const btnReporte = document.getElementById('btn-reporte');

    totalRevenueDisplay.textContent = 'Bs 0';
    totalRevenueTheoretical.textContent = 'Bs 0';
    totalPhysicalDisplay.textContent = 'Bs 0';
    cuadreResult.textContent = 'Pendiente de cálculo';
    cuadreResult.classList.remove('cuadra', 'falta', 'sobra');
    analysisDiv.innerHTML = '';


    reportList.innerHTML = `
        <div class="report-header-row">
            <div class="report-cell col-producto">PROD.</div>
            <div class="report-cell col-vendido">VENDIDO</div>
            <div class="report-cell col-regalo">REGALO</div>
            <div class="report-cell col-ingreso">INGRESO (BS)</div>
        </div>
        <p style="text-align:center; color:#ccc; padding:20px 0;">Datos borrados. Ingrese el nuevo stock inicial.</p>
    `;

    btnReporte.disabled = true;
    btnReporte.style.opacity = '0.5';
}

/**
 * Muestra un modal de confirmación temporal.
 */
function showToast(message) {
    // ... (Tu función original showToast)
    const toast = document.getElementById("toast-message");
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(function(){ 
        toast.classList.remove("show");
        setTimeout(() => { toast.style.visibility = 'hidden'; }, 500); 
    }, 2000); 
}


/**
 * Borra todos los datos guardados.
 */
function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);

    products.forEach((product, index) => {
        const inputsToClear = ['initial', 'final', 'gift', 'sold'];
        inputsToClear.forEach(type => {
            const input = document.getElementById(`${type}-${index}`);
            if (input) input.value = '';
        });

        const revenueDisplay = document.getElementById(`revenue-${index}`);
        if (revenueDisplay) {
            revenueDisplay.querySelector('.units-sold').textContent = '-';
            revenueDisplay.querySelector('.money-sold').textContent = 'Bs ---';
        }
    });

    // Limpiar el campo de caja física
    document.getElementById('cash-physical-input').value = '';

    clearReportView();
    showToast("¡Datos de inventario limpiados! ✅");
    showView('registros-view');
} 

/**
 * FUNCIÓN DE INICIALIZACIÓN Y RENDERIZADO
 */
function renderProducts() {
    const inventoryListDiv = document.getElementById('inventory-list');
    const unitSaleListDiv = document.getElementById('unit-sale-list');
    inventoryListDiv.innerHTML = ''; 
    unitSaleListDiv.innerHTML = ''; 

    const allSavedData = loadAllInputData();
    let hasData = false; 

    // Cargar el valor de caja física si existe
    const physicalCashData = allSavedData['cash'] || {};
    document.getElementById('cash-physical-input').value = physicalCashData.physical || '';


    products.forEach((product, index) => {
        // ... (Tu lógica original de renderizado de productos)
        const productData = allSavedData[index] || {};
        const isInventory = product.type === 'inventory';

        const initialValue = productData.initial || ''; 
        const finalValue = productData.final || ''; 
        const giftValue = productData.gift || ''; 
        const soldValue = productData.sold || ''; 

        if (initialValue || finalValue || giftValue || soldValue) {
            hasData = true;
        }

        const item = document.createElement('div');
        item.className = 'product-item' + (isInventory ? '' : ' unit-sale-item');

        let inputDetailsHtml = '';
        let productDetailsClass = 'product-details';

        if (isInventory) {
            // Productos de Inventario (Botellas)
            inputDetailsHtml = `
                <div class="input-item">
                    <label for="initial-${index}">Inicial</label>
                    <input type="number" id="initial-${index}" value="${initialValue}" min="0" onchange="saveInputData(${index}, 'initial', this.value)">
                </div>
                <div class="input-item">
                    <label for="final-${index}">Final</label>
                    <input type="number" id="final-${index}" value="${finalValue}" min="0" onchange="saveInputData(${index}, 'final', this.value)">
                </div>
                <div class="input-item">
                    <label for="gift-${index}">Regalo</label>
                    <input type="number" id="gift-${index}" value="${giftValue}" min="0" onchange="saveInputData(${index}, 'gift', this.value)">
                </div>
            `;
        } else {
            // Productos de Venta por Unidad (Shots/Vasos)
            inputDetailsHtml = `
                <div class="input-item">
                    <label for="sold-${index}">CANTIDAD VENDIDA</label>
                    <input type="number" id="sold-${index}" value="${soldValue}" min="0" onchange="saveInputData(${index}, 'sold', this.value)">
                </div>
                <div class="input-item" style="width: 5%"></div> 
            `;
            productDetailsClass = 'product-details unit-sale-details';
        }

        item.innerHTML = `
            <div class="product-header">
                <span>${product.name}</span>
                <span class="price-tag">(Bs ${product.price})</span>
            </div>

            <div class="${productDetailsClass}">
                ${inputDetailsHtml}
                <div id="revenue-${index}" class="revenue-display">
                    <span class="units-sold" style="color:#aaa; font-size:0.9em;">-</span>
                    <span class="money-sold" style="color:#aaa;">Bs ---</span>
                </div>
            </div>
        `;

        if (isInventory) {
            inventoryListDiv.appendChild(item);
        } else {
            unitSaleListDiv.appendChild(item);
        }
    });

    if (hasData) {
        calculateResults(true); 
    } else {
        clearReportView();
        showView('registros-view');
    }
}

/**
 * Analiza la discrepancia entre el total teórico y el físico.
 */

function analyzeDiscrepancy(discrepancy) {
    const abs = Math.abs(discrepancy);
    const type = discrepancy > 0 ? "sobrante" : "faltante";

    // Todos los productos (botellas + unidad) ordenados de barato a caro
    const all = products.map(p => ({name: p.name, price: p.price})).sort((a,b) => a.price - b.price);

    let text = `<b>La diferencia de Bs ${abs} (${type}) puede deberse a:</b><br><br>`;

    // 1. Errores mínimos de cambio
    if (abs <= 5) {
        text += `• <b>Probable error de cambio:</b> monedas o billetes mal entregados o recibidos.<br>`;
        text += `• Diferencias pequeñas como ${abs} Bs suelen ser errores humanos al dar vuelto.<br>`;
        return text;
    }

    // 2. Coincidencia exacta con algún producto
    const exact = all.find(p => p.price === abs);
    if (exact) {
        text += `• <b>Producto exacto coincidente:</b> 1 × <b>${exact.name}</b> (Bs ${exact.price}) no marcado o cobrado demás.<br>`;
        return text;
    }

    // 3. Producto más probable según precio más cercano
    let closest = all.reduce((prev, curr) => {
        return (Math.abs(curr.price - abs) < Math.abs(prev.price - abs)) ? curr : prev;
    });
    if (closest.price < abs) {
        const count = Math.floor(abs / closest.price);
        text += `• <b>Producto probable:</b> ~${count} × <b>${closest.name}</b> (Bs ${closest.price}) sumando cerca de ${count*closest.price} Bs.<br>`;
    }

    // 4. Productos caros si la diferencia es alta
    const expensive = all.filter(p => p.price >= 200 && p.price <= abs);
    if (expensive.length > 0) {
        text += `• <b>Revise productos caros:</b> `;
        expensive.forEach(p => text += `<b>${p.name}</b> (Bs ${p.price}), `);
        text = text.slice(0,-2) + ".<br>";
    }

    // 5. Buscar combinaciones aproximadas de 2 productos
    let comboFound = false;
    for (let i = all.length - 1; i >= 0; i--) {
        for (let j = i; j >= 0; j--) {
            const sum = all[i].price + all[j].price;
            if (sum <= abs && abs - sum <= 5) { // tolerancia de 5 Bs
                text += `• <b>Posible registro mal:</b> 1 × <b>${all[i].name}</b> + 1 × <b>${all[j].name}</b> = ${sum} Bs (aprox.)<br>`;
                comboFound = true;
                break;
            }
        }
        if (comboFound) break;
    }

    // 6. Buscar combinaciones aproximadas de 3 productos si no hay 2
    if (!comboFound) {
        outerLoop:
        for (let i = all.length - 1; i >= 0; i--) {
            for (let j = i; j >= 0; j--) {
                for (let k = j; k >= 0; k--) {
                    const sum = all[i].price + all[j].price + all[k].price;
                    if (sum <= abs && abs - sum <= 5) { // tolerancia de 5 Bs
                        text += `• <b>Posible registro mal:</b> 1 × <b>${all[i].name}</b> + 1 × <b>${all[j].name}</b> + 1 × <b>${all[k].name}</b> = ${sum} Bs (aprox.)<br>`;
                        comboFound = true;
                        break outerLoop;
                    }
                }
            }
        }
    }

    // 7. Consejos generales
    text += `<br>• También puede ser suma de varios productos no registrados o error de inventario.<br>`;
    text += `• Revise inventario y ventas unitarias para detectar errores.<br>`;

    return text;
}



/**
 * FUNCIÓN DE CUADRE DE CAJA FINAL
 */

function quadreCaja() {
    const physicalDisplay = document.getElementById('total-physical-display');
    const theoreticalDisplay = document.getElementById('total-revenue-display-theoretical');
    const cuadreResult = document.getElementById('cuadre-result');
    const analysisDiv = document.getElementById('discrepancy-analysis');

    physicalCashInput = parseInt(document.getElementById('cash-physical-input').value) || 0;

    theoreticalDisplay.textContent = `Bs ${globalTotalRevenue}`;
    physicalDisplay.textContent = `Bs ${physicalCashInput}`;

    const discrepancy = physicalCashInput - globalTotalRevenue;

    cuadreResult.classList.remove('cuadra', 'falta', 'sobra');
    analysisDiv.innerHTML = '';

    if (physicalCashInput === 0) {
         cuadreResult.textContent = "❗ INGRESE TOTAL DE CAJA FÍSICA para el cuadre.";
         cuadreResult.classList.add('falta');
         analysisDiv.innerHTML = "Debe ingresar un valor físico para comparar.";
         return;
    }

    if (discrepancy === 0) {
        cuadreResult.textContent = "✅ ¡CAJA CUADRADA EXACTAMENTE! ✅";
        cuadreResult.classList.add('cuadra');
        analysisDiv.textContent = "El ingreso físico coincide con el teórico.";
        return;
    }

    // --- Mostrar siempre el análisis (NUEVO) ---
    if (discrepancy > 0) {
        cuadreResult.textContent = `⚠️ SOBRANTE: Bs ${discrepancy}`;
        cuadreResult.classList.add('sobra');
        analysisDiv.innerHTML = analyzeDiscrepancy(discrepancy); 
    } else {
        const absDiscrepancy = Math.abs(discrepancy);
        cuadreResult.textContent = `❌ FALTANTE: Bs ${absDiscrepancy}`;
        cuadreResult.classList.add('falta');
        analysisDiv.innerHTML = analyzeDiscrepancy(discrepancy);
    }
}

/**
 * FUNCIÓN DE CÁLCULO
 */
function calculateResults(autoLoad = false) {
    // ... (Tu función original calculateResults)
    globalTotalRevenue = 0;
    reportData = []; 

    products.forEach((product, index) => {
        const price = product.price;
        let soldUnits = 0;
        let giftedUnits = 0; 
        const revenueDisplay = document.getElementById(`revenue-${index}`);

        if (product.type === 'inventory') {
            // --- Cálculo para Inventario (Botellas) ---
            const initialStock = parseInt(document.getElementById(`initial-${index}`).value) || 0;
            const finalStock = parseInt(document.getElementById(`final-${index}`).value) || 0;
            giftedUnits = parseInt(document.getElementById(`gift-${index}`).value) || 0;

            const consumedUnits = initialStock - finalStock;
            soldUnits = consumedUnits - giftedUnits;
            if (soldUnits < 0) { soldUnits = 0; }

        } else if (product.type === 'unit-sale') {
            // --- Cálculo para Venta por Unidad (Shots/Vasos) ---
            soldUnits = parseInt(document.getElementById(`sold-${index}`).value) || 0;
            giftedUnits = 0; 
        }

        const revenue = soldUnits * price;
        const roundedRevenue = Math.round(revenue);
        globalTotalRevenue += roundedRevenue;

        // Actualizar la vista de Registros 
        if (revenueDisplay) {
             if (product.type === 'inventory') {
                revenueDisplay.querySelector('.units-sold').textContent = `${soldUnits} Vendidas`;
            } else {
                revenueDisplay.querySelector('.units-sold').textContent = `Total: ${soldUnits} Unidades`;
            }
            revenueDisplay.querySelector('.money-sold').textContent = `Bs ${roundedRevenue}`;
        }

        // Guardar para el Reporte 
        reportData.push({
            name: product.name,
            units: soldUnits,
            revenue: roundedRevenue, 
            gifted: giftedUnits,
            price: price,
            type: product.type
        });
    });

    fillReportView(); // Genera la tabla del reporte
    quadreCaja(); // Llama a la nueva función de cuadre

    document.getElementById('btn-reporte').disabled = false;
    document.getElementById('btn-reporte').style.opacity = '1';

    if (!autoLoad) {
        showView('reporte-view');
    } else {
        showView('registros-view'); 
    }
}

/**
 * FUNCIÓN PARA LLENAR LA VISTA DE REPORTE (SIN ENCABEZADOS DE SECCIÓN EXTRA)
 */
function fillReportView() {
    const reportList = document.getElementById('report-units-list');
    const totalRevenueDisplay = document.getElementById('total-revenue-display'); // El total general

    let reportHtml = `
        <div class="report-header-row">
            <div class="report-cell col-producto">PROD.</div>
            <div class="report-cell col-vendido">VENDIDO</div>
            <div class="report-cell col-regalo">REGALO</div>
            <div class="report-cell col-ingreso">INGRESO (BS)</div>
        </div>
    `;

    let totalUnitsSoldInventory = 0;
    let totalGiftedUnitsInventory = 0;
    let totalRevenueInventory = 0;

    let totalUnitsSoldUnit = 0;
    let totalRevenueUnit = 0;

    // --- 1. Reporte de INVENTARIO (Botellas) --- (MANTENIDO)
    // Se quita el encabezado extra "Detalle de Venta de Botellas"

    let inventoryRows = reportData.filter(item => item.type === 'inventory');
    if (inventoryRows.length > 0) {
        inventoryRows.forEach(item => {
            if (item.units > 0 || item.gifted > 0) { 
                totalUnitsSoldInventory += item.units;
                totalGiftedUnitsInventory += item.gifted;
                totalRevenueInventory += item.revenue;

                reportHtml += `
                    <div class="report-data-row">
                        <div class="report-cell col-producto">${item.name}</div> 
                        <div class="report-cell col-vendido">${item.units}</div>
                        <div class="report-cell col-regalo">${item.gifted}</div>
                        <div class="report-cell col-ingreso">Bs ${item.revenue}</div> 
                    </div>
                `;
            }
        });
    }

    // Fila de TOTALES de INVENTARIO
    if (totalRevenueInventory > 0) {
        reportHtml += `
            <div class="total-summary-row" style="border-top: 2px solid var(--color-primary);">
                <div class="report-cell col-producto" style="color:var(--color-secondary);">SUBTOTAL BOTELLAS</div>
                <div class="report-cell col-vendido">${totalUnitsSoldInventory}</div>
                <div class="report-cell col-regalo">${totalGiftedUnitsInventory}</div>
                <div class="report-cell col-ingreso" style="color:var(--color-secondary); padding-right:5px;">Bs ${totalRevenueInventory}</div>
            </div>
        `;
    }

    // --- 2. Reporte de VENTA POR UNIDAD (Shots/Vasos) --- (MANTENIDO)
    // Se quita el encabezado extra "Detalle de Venta por Unidad (Shots/Vasos)"

    let unitSaleRows = reportData.filter(item => item.type === 'unit-sale');
    if (unitSaleRows.length > 0) {
        unitSaleRows.forEach(item => {
            if (item.units > 0) { 
                totalUnitsSoldUnit += item.units;
                totalRevenueUnit += item.revenue;

                reportHtml += `
                    <div class="report-data-row" style="background-color: #3f4a5a;">
                        <div class="report-cell col-producto" style="color:var(--color-primary);">${item.name}</div> 
                        <div class="report-cell col-vendido">${item.units}</div>
                        <div class="report-cell col-regalo">-</div>
                        <div class="report-cell col-ingreso" style="color:var(--color-success);">Bs ${item.revenue}</div> 
                    </div>
                `;
            }
        });
    } else {
        // Manejo del caso si no hay ventas de unidad
         // reportHtml += `<p style="text-align:center; color:#ccc; padding:10px 0;">No se registraron ventas por unidad (Shots/Vasos).</p>`;
    }

    // Fila de TOTALES de VENTA POR UNIDAD
    if (totalRevenueUnit > 0) {
        reportHtml += `
            <div class="total-summary-row" style="border-top: 2px solid var(--color-primary); margin-bottom: 5px;">
                <div class="report-cell col-producto" style="color:var(--color-primary);">SUBTOTAL UNIDAD</div>
                <div class="report-cell col-vendido">${totalUnitsSoldUnit}</div>
                <div class="report-cell col-regalo">-</div>
                <div class="report-cell col-ingreso" style="color:var(--color-primary); padding-right:5px;">Bs ${totalRevenueUnit}</div>
            </div>
        `;
    }

    // Manejo de caso sin ventas (si ambos subtotales son 0)
    if (totalRevenueInventory === 0 && totalRevenueUnit === 0) {
         reportList.innerHTML = `<p style="text-align:center; color:#ccc; padding:20px 0;">Aún no se ha registrado venta o consumo.</p>`;
    } else {
         reportList.innerHTML = reportHtml;
    }


    // --- 3. Total General de Venta Bruta ---
    totalRevenueDisplay.textContent = `Bs ${globalTotalRevenue}`;
}

// --- FUNCIONES DE NAVEGACIÓN (TABS) ---
function showView(viewId) {
    document.getElementById('registros-view').style.display = 'none';
    document.getElementById('reporte-view').style.display = 'none';

    document.getElementById('btn-registros').classList.remove('active');
    document.getElementById('btn-reporte').classList.remove('active');

    document.getElementById(viewId).style.display = 'block';

    document.getElementById('btn-' + viewId.replace('-view', '')).classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// Inicializar la aplicación al cargar la página
window.onload = renderProducts;