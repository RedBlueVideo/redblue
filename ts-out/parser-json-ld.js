'use strict';
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
                        snapshotItems: [snapshotItem],
                        snapshotLength: 1,
                    });
                }
            }
            return new JSONXPathResult();
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLWpzb24tbGQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcGFyc2VyLWpzb24tbGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsWUFBWSxDQUFDO0FBb0RiLE1BQU0sT0FBTyxlQUFlO0lBaUIxQixZQUFhLGFBQXVFLEVBQUU7UUFHcEYsSUFBSyxVQUFVLENBQUMsWUFBWSxFQUFHLENBQUM7WUFDOUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDO1FBQy9DLENBQUM7UUFFRCxJQUFLLFVBQVUsQ0FBQyxvQkFBb0IsRUFBRyxDQUFDO1lBQ3RDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUM7UUFDL0QsQ0FBQzthQUFNLENBQUM7WUFDTixJQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFDO1FBQ3JDLENBQUM7UUFFRCxJQUFLLFVBQVUsQ0FBQyxXQUFXLEVBQUcsQ0FBQztZQUM3QixJQUFJLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUM7UUFDN0MsQ0FBQztRQUVELElBQUssVUFBVSxDQUFDLFVBQVUsRUFBRyxDQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQztRQUMzQyxDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDLDBCQUEwQixDQUFDO1FBQzVELENBQUM7UUFFRCxJQUFLLFVBQVUsQ0FBQyxlQUFlLEVBQUcsQ0FBQztZQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLGVBQWUsQ0FBQztRQUNyRCxDQUFDO1FBRUQsSUFBSyxVQUFVLENBQUMsY0FBYyxFQUFHLENBQUM7WUFDaEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxVQUFVLENBQUMsY0FBYyxDQUFDO1FBQ25ELENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLGVBQWUsR0FBRyxD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