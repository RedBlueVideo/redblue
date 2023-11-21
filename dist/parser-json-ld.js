'use strict';
;
export class JSONXPathResult {
    constructor(properties = {}) {
        if (properties.booleanValue) {
            this._booleanValue = properties.booleanValue;
        }
        if (properties.invalidIteratorState) {
            this._invalidIteratorState = properties.invalidIteratorState;
        }
        else {
            this._invalidIteratorState = false;
        }
        if (properties.numberValue) {
            this._numberValue = properties.numberValue;
        }
        if (properties.resultType) {
            this._resultType = properties.resultType;
        }
        else {
            this._resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
        }
        if (properties.singleNodeValue) {
            this._singleNodeValue = properties.singleNodeValue;
        }
        if (properties.snapshotLength) {
            this._snapshotLength = properties.snapshotLength;
        }
        else {
            this._snapshotLength = 0;
        }
        if (properties.stringValue) {
            this._stringValue = properties.stringValue;
        }
        else {
            this._stringValue = '';
        }
        if (properties.snapshotItems) {
            this._snapshotItems = properties.snapshotItems;
        }
        else {
            this._snapshotItems = [];
        }
    }
    get booleanValue() {
        return this._booleanValue;
    }
    get invalidIteratorState() {
        return this._invalidIteratorState;
    }
    get numberValue() {
        return this._numberValue;
    }
    get resultType() {
        return this._resultType;
    }
    get singleNodeValue() {
        return this._singleNodeValue;
    }
    get snapshotLength() {
        return this._snapshotLength;
    }
    get stringValue() {
        return this._stringValue;
    }
    snapshotItem(index) {
        return this._snapshotItems[index];
    }
    iterateNext() {
        return this._snapshotItems.shift();
    }
}
export function JSONLDParser(Base) {
    return class RedBlueJSONLDParser extends Base {
        constructor(...args) {
            super(...args);
            this.MISSING_JSONLD_CONTEXT_ERROR = 'Can’t process; missing `@context` root-level property in JSON-LD';
        }
        connectedCallback() {
            super.connectedCallback();
        }
        get hasJSONLDParser() {
            return true;
        }
        async resolveCSSNamespacePrefixFromJSONLD(defaultPrefix = 'css') {
            const USING_DEFAULT_CSS_PREFIX = `Default CSS namespace prefix of \`${defaultPrefix}\` will be used to look up hotspot styling.`;
            if (!this.hvml.jsonLD) {
                console.warn(`JSON-LD HVML data is not yet loaded.\n${USING_DEFAULT_CSS_PREFIX}`);
                return defaultPrefix;
            }
            if (!this.hvml.jsonLD['@context'] || !this.hvml.jsonLD['@context'].length) {
                console.warn(`JSON-LD Context is blank or missing.\n${USING_DEFAULT_CSS_PREFIX}`);
                return defaultPrefix;
            }
            let context = this.hvml.jsonLD['@context'];
            if (typeof context === 'string') {
                const request = new Request(context);
                context = await fetch(request)
                    .then((response) => {
                    if (!response.ok) {
                        throw new Error(`JSON-LD Context interpreted as URL but unresolvable: \`${this.hvml.jsonLD['@context']}\`.\n${USING_DEFAULT_CSS_PREFIX}`);
                    }
                    return response.json();
                })
                    .then((response) => response['@context'])
                    .catch((notOK) => {
                    console.warn(notOK);
                });
            }
            if (context) {
                for (const property in context) {
                    if (context[property].match(/https?:\/\/www\.w3\.org\/TR\/CSS\/?/i)) {
                        return property;
                    }
                }
            }
            return defaultPrefix;
        }
        getAnnotationsFromJSONLD() {
            const annotations = [];
            const $presentation = this.findInJSONLD(`.//presentation[1]`).snapshotItem(0);
            for (const nodeName in $presentation) {
                switch (nodeName) {
                    case 'choice':
                        for (const grandchildNodeName in $presentation[nodeName]) {
                            switch (grandchildNodeName) {
                                case 'name':
                                    $presentation[nodeName][grandchildNodeName] = $presentation[nodeName][grandchildNodeName].reduce((previous, current) => {
                                        switch (typeof current) {
                                            case 'string':
                                                return previous + current;
                                            case 'object':
                                                return `${previous}<${current['@type']} style="${current.style}">${current.textContent}</${current['@type']}>`;
                                            default:
                                                throw new TypeError(`Cannot get annotation: node must be a String or an Object; got ${typeof current}`);
                                        }
                                    });
                                    break;
                                default:
                            }
                        }
                        $presentation[nodeName].type = 'choice';
                        annotations.push($presentation[nodeName]);
                        break;
                    default:
                }
            }
            return annotations;
        }
        findInJSONLD(xpathExpression, contextNode = this.hvml.jsonLD, namespaceResolver = null, resultType = XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, result = null) {
            if (RedBlueJSONLDParser.customJSONSearchUtility) {
                return RedBlueJSONLDParser.customJSONSearchUtility(xpathExpression, contextNode, namespaceResolver, resultType, result);
            }
            if (!contextNode) {
                throw new ReferenceError(`Missing \`contextNode\` parameter.`);
            }
            const xpathAtoms = [];
            const xpathRegex__contains = /([^[\]]+\[contains\(\s*[^,]+,\s*(['"]).*\2\s*\)\])/i;
            const xpathRegex__rootDescendants = /^\/\//i;
            const xpathRegex__localDescendants = /\.\/\//i;
            const xpathRegex__withAttribute = /[^[\]]+\[@[^=]+=(['"]).*\1\]/i;
            const xpathRegex__withIndex = /[^[\]]+\[[0-9]+\]/i;
            const xpathRegex__text = /text\(\)/i;
            const xpathRegex__brackets = /[[\]]/i;
            if (xpathRegex__rootDescendants.test(xpathExpression)) {
                xpathExpression = xpathExpression.replace(xpathRegex__rootDescendants, '');
            }
            else if (xpathRegex__localDescendants.test(xpathExpression)) {
                xpathExpression = xpathExpression.replace(xpathRegex__localDescendants, '');
            }
            const xpathParts = xpathExpression.split(xpathRegex__contains);
            for (let i = 0; i < xpathParts.length; i++) {
                const xpathPart = xpathParts[i];
                if (!xpathRegex__contains.test(xpathPart)) {
                    const split = xpathPart.split('/');
                    for (let j = 0; j < split.length; j++) {
                        if (split[j] !== '') {
                            xpathAtoms.push(split[j]);
                        }
                    }
                }
                else {
                    xpathAtoms.push(xpathPart.replace(/\//i, ''));
                }
            }
            let xpathAtom;
            let node;
            let lastNode = null;
            while (xpathAtoms.length > 0) {
                xpathAtom = xpathAtoms.shift();
                if (xpathRegex__withIndex.test(xpathAtom)) {
                    const xpathSubatomicParticles = xpathAtom.split(xpathRegex__brackets);
                    xpathSubatomicParticles.pop();
                    const nodeIndex = Number(xpathSubatomicParticles[1]) - 1;
                    if ((nodeIndex === 0) && this.HVML_SOLO_ELEMENTS.indexOf(xpathSubatomicParticles[0]) !== -1) {
                        if (lastNode) {
                            this.log(`lastNode[${xpathSubatomicParticles[0]}]`, lastNode[xpathSubatomicParticles[0]]);
                            node = lastNode[xpathSubatomicParticles[0]];
                        }
                        else {
                            this.log(`contextNode[${xpathSubatomicParticles[0]}];`, contextNode[xpathSubatomicParticles[0]]);
                            node = contextNode[xpathSubatomicParticles[0]];
                        }
                    }
                    else {
                        if (lastNode) {
                            node = lastNode[xpathSubatomicParticles[0]][xpathSubatomicParticles[1]];
                        }
                        else {
                            node = contextNode[xpathSubatomicParticles[0]][xpathSubatomicParticles[1]];
                        }
                    }
                    if (!node) {
                        return new JSONXPathResult();
                    }
                }
                else if (xpathRegex__withAttribute.test(xpathAtom)) {
                    const xpathSubatomicParticles = xpathAtom.split(xpathRegex__brackets);
                    xpathSubatomicParticles.pop();
                    if (lastNode) {
                        node = lastNode[xpathSubatomicParticles[0]];
                    }
                    else {
                        node = contextNode[xpathSubatomicParticles[0]];
                    }
                    if (!node) {
                        return new JSONXPathResult();
                    }
                    const [attributeSelectorName, attributeSelectorValue] = xpathSubatomicParticles[1].replace(/@([^=]+)=(['"])(.*)\2/i, '$1=$3').split('=');
                    if (node[attributeSelectorName] !== attributeSelectorValue) {
                        return new JSONXPathResult();
                    }
                }
                else if (xpathRegex__contains.test(xpathAtom)) {
                    const xpathSubatomicParticles = xpathAtom.split(xpathRegex__brackets);
                    xpathSubatomicParticles.pop();
                    if (lastNode) {
                        node = lastNode[xpathSubatomicParticles[0]];
                    }
                    else {
                        node = contextNode[xpathSubatomicParticles[0]];
                    }
                    if (!node) {
                        return new JSONXPathResult();
                    }
                    const containsTest = xpathSubatomicParticles[1].replace(/contains\(\s*[^,]+,\s*(["'])(.*)\1\)/i, '$2');
                    if (node.indexOf(containsTest) === -1) {
                        return new JSONXPathResult();
                    }
                }
                else if (xpathRegex__text.test(xpathAtom)) {
                    node = lastNode;
                }
                else {
                    node = contextNode[xpathAtom];
                    if (!node) {
                        return new JSONXPathResult();
                    }
                }
                if (xpathAtoms.length > 0) {
                    lastNode = node;
                }
                else {
                    if (lastNode === null) {
                        if (!node) {
                            return new JSONXPathResult();
                        }
                        lastNode = node;
                    }
                    let snapshotItem;
                    switch (typeof lastNode) {
                        case 'string':
                            snapshotItem = {
                                _isJSONElement: true,
                                nodeType: Node.TEXT_NODE,
                                nodeName: '#text',
                                nodeValue: lastNode,
                                getAttribute: () => null,
                                getAttributeNS: () => null,
                                textContent: lastNode,
                                childNodes: [],
                                children: [],
                            };
                            break;
                        case 'object':
                        default:
                            snapshotItem = {
                                ...lastNode,
                                _isJSONElement: true,
                                nodeType: Node.ELEMENT_NODE,
                                nodeName: lastNode['@type'],
                                nodeValue: null,
                                textContent: JSON.stringify(lastNode),
                            };
                    }
                    return new JSONXPathResult({
                        "snapshotItems": [snapshotItem],
                        "snapshotLength": 1,
                    });
                }
            }
            return new JSONXPathResult();
        }
    };
}
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLWpzb24tbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGFyc2VyLWpzb24tbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsWUFBWSxDQUFDO0FBVXNDLENBQUM7QUEwQ3BELE1BQU0sT0FBTyxlQUFlO0lBVTFCLFlBQWEsYUFBdUUsRUFBRTtRQUdwRixJQUFLLFVBQVUsQ0FBQyxZQUFZLEVBQUcsQ0FBQztZQUM5QixJQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUM7UUFDL0MsQ0FBQztRQUVELElBQUssVUFBVSxDQUFDLG9CQUFvQixFQUFHLENBQUM7WUFDdEMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLFVBQVUsQ0FBQyxvQkFBb0IsQ0FBQztRQUMvRCxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFDckMsQ0FBQztRQUVELElBQUssVUFBVSxDQUFDLFdBQVcsRUFBRyxDQUFDO1lBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQztRQUM3QyxDQUFDO1FBRUQsSUFBSyxVQUFVLENBQUMsVUFBVSxFQUFHLENBQUM7WUFDNUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO1FBQzNDLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsMEJBQTBCLENBQUM7UUFDNUQsQ0FBQztRQUVELElBQUssVUFBVSxDQUFDLGVBQWUsRUFBRyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsZUFBZSxDQUFDO1FBQ3JELENBQUM7UUFFRCxJQUFLLFVBQVUsQ0FBQyxjQUFjLEVBQUcsQ0FBQztZQUNoQyxJQUFJLENBQUMsZUFBZSxHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUM7UUFDbkQsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMs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