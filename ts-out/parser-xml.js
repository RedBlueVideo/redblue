'use strict';
import RedBlueVideo from "./redblue-video.js";
export function XMLParser(Base) {
    return class RedBlueXMLParser extends Base {
        constructor(...args) {
            super(...args);
            this.XML = {
                xmlDoc: null,
                xmlLoaded: false,
                evaluator: new XPathEvaluator(),
                nsResolver: null,
                ns: {
                    xml: "http://www.w3.org/XML/1998/namespace",
                },
                read: () => {
                    this.log('reading XHR result');
                    const result = this.find('//video/presentation/playlist');
                    if (result) {
                    }
                },
                import: (xmlFile) => {
                    this.log('--XML.import()--');
                    const xhr = new XMLHttpRequest();
                    xhr.open('GET', xmlFile, true);
                    xhr.setRequestHeader('Content-Type', 'text/xml');
                    xhr.onload = () => {
                        switch (xhr.status) {
                            case 200:
                                this.XML.xmlDoc = xhr.responseXML;
                                this.XML.read();
                                for (let i = this.mediaQueue.length - 1; i >= 0; --i) {
                                    this.XHR.GET(this.mediaQueue[i].path, this.mediaQueue[i].mime, (binary, type) => this.log(`readPlaylistItem( binary, type )`, binary, type));
                                }
                                this.log('--import()--');
                                this.log('this.play();');
                                break;
                            default:
                        }
                    };
                    xhr.send('');
                },
            };
        }
        get hasXMLParser() {
            return true;
        }
        resolveCSSNamespacePrefixFromXML(defaultPrefix = 'css') {
            for (let i = 0; i < this.hvml.xml.attributes.length; i++) {
                const attribute = this.hvml.xml.attributes[i].nodeName;
                const namespaceAttribute = attribute.match(/^xmlns:([^=]+)/i);
                const attributeValue = this.hvml.xml.getAttribute(attribute);
                if (namespaceAttribute && (attributeValue.match(/https?:\/\/(www\.)?w3\.org\/TR\/CSS\/?/i))) {
                    return namespaceAttribute[1];
                }
            }
            return defaultPrefix;
        }
        getAnnotationFromChoiceElement($child) {
            const choice = {};
            if (this.hasAttributeAnyNS($child, 'xml:id')) {
                choice['xml:id'] = this.getAttributeAnyNS($child, 'xml:id');
            }
            choice.id = $child.id;
            for (let i = 0; i < $child.children.length; i++) {
                const $grandchild = $child.children[i];
                const nodeName = $grandchild.nodeName.toLowerCase();
                switch (nodeName) {
                    case 'name':
                        choice[nodeName] = ($grandchild.nodeValue || $grandchild.innerHTML);
                        break;
                    case 'goto':
                        choice.goto = this.nodeAttributesToJSON($grandchild.attributes);
                        choice.goto.animate = (Array.isArray($grandchild.children)
                            ? $grandchild.children
                            : Array.from($grandchild.children))
                            .filter(($gotoChild) => {
                            const currentNodeName = $gotoChild.nodeName.toLowerCase();
                            switch (currentNodeName) {
                                case 'animate':
                                    return true;
                                default:
                                    return false;
                            }
                        })
                            .map((animateElement) => this.nodeAttributesToJSON(animateElement.attributes));
                        break;
                    default:
                }
            }
            choice.type = $child.nodeName.toLowerCase();
            return choice;
        }
        getAnnotationsFromXML(xpath = `.//presentation[1]`, contextNode) {
            let annotations = [];
            const presentationFindResult = this.find(xpath, contextNode);
            if (presentationFindResult.snapshotLength) {
                const $element = presentationFindResult.snapshotItem(0);
                for (let i = 0, { "length": childrenLength } = $element.children; i < childrenLength; i++) {
                    const $child = $element.children[i];
                    const nodeName = $child.nodeName.toLowerCase();
                    switch (nodeName) {
                        case 'choiceprompt': {
                            const choicePrompt = {
                                type: "choicePrompt",
                            };
                            for (let j = 0, { "length": grandchildrenLength } = $child.children; j < grandchildrenLength; j++) {
                                const $grandchild = $child.children[j];
                                const grandchildNodeName = $grandchild.nodeName.toLowerCase();
                                if (this.hasAttributeAnyNS($grandchild, 'xml:id')) {
                                    choicePrompt['xml:id'] = this.getAttributeAnyNS($grandchild, 'xml:id');
                                }
                                choicePrompt.id = $grandchild.id;
                                switch (grandchildNodeName) {
                                    case 'name':
                                        choicePrompt.name = $grandchild.textContent;
                                        break;
                                    case 'media':
                                        choicePrompt.media = this.nodeAttributesToJSON($grandchild.attributes);
                                        break;
                                    default:
                                }
                            }
                            choicePrompt.choices = this.getAnnotationsFromXML(`.`, $child);
                            annotations.push(choicePrompt);
                            break;
                        }
                        case 'choice':
                            annotations.push(this.getAnnotationFromChoiceElement($child));
                            break;
                        case 'playlist':
                            if ($child.getAttribute('type') === 'nonlinear') {
                                annotations = annotations.concat(this.getAnnotationsFromXML(`.`, $child));
                            }
                            break;
                        default:
                    }
                }
            }
            return annotations;
        }
        findInXML(xpathExpression, $contextNode) {
            if (!$contextNode) {
                $contextNode = this.hvml.xml;
            }
            return document.evaluate(xpathExpression, $contextNode, (prefix) => (prefix ? RedBlueVideo.NS[prefix] : RedBlueVideo.NS.html), XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLXhtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXJzZXIteG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE9BQU8sWUFBdUcsTUFBTSxvQkFBb0IsQ0FBQztBQUd6SSxNQUFNLFVBQVUsU0FBUyxDQUFxQyxJQUFjO0lBQzFFLE9BQU8sTUFBTSxnQkFBaUIsU0FBUSxJQUFJO1FBYXhDLFlBQWEsR0FBRyxJQUFXO1lBQ3pCLEtBQUssQ0FBRSxHQUFHLElBQUksQ0FBRSxDQUFDO1lBRWpCLElBQUksQ0FBQyxHQUFHLEdBQUc7Z0JBQ1QsTUFBTSxFQUFFLElBQUk7Z0JBQ1osU0FBUyxFQUFFLEtBQUs7Z0JBQ2hCLFNBQVMsRUFBRSxJQUFJLGNBQWMsRUFBRTtnQkFDL0IsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLEVBQUUsRUFBRTtvQkFDRixHQUFHLEVBQUUsc0NBQXNDO2lCQUM1QztnQkFLRCxJQUFJLEVBQUUsR0FBRyxFQUFFO29CQUdULElBQUksQ0FBQyxHQUFHLENBQUUsb0JBQW9CLENBQUUsQ0FBQztvQkFFakMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO29CQUU1RCxJQUFLLE1BQU0sRUFBRyxDQUFDO29CQUVmLENBQUM7Z0JBQ0gsQ0FBQztnQkFLRCxNQUFNLEVBQUUsQ0FBRSxPQUFlLEVBQUcsRUFBRTtvQkFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBRSxrQkFBa0IsQ0FBRSxDQUFDO29CQUMvQixNQUFNLEdBQUcsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO29CQUVqQyxHQUFHLENBQUMsSUFBSSxDQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFFLENBQUM7b0JBQ2pDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBRSxjQUFjLEVBQUUsVUFBVSxDQUFFLENBQUM7b0JBQ25ELEdBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFF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