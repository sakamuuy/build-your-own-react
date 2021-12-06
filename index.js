const step0 = () => {
  const element = {
    type: 'h1',
    props: {
      title: 'foo',
      children: 'Hello'
    }
  }

  const node = document.createElement(element.type)
  node['title'] = element.props.title

  const text = document.createTextNode('')
  text['nodeValue'] = element.props.children

  const container = document.getElementById('root')
  node.appendChild(text)
  container.appendChild(node)
}

(() => {

  function createTextElement(text) {
    return {
      type: 'TEXT_ELEMENT',
      props: {
        nodeValue: text,
        children: []
      }
    }
  }

  function createElement(type, props, ...children) {
    return {
      type,
      props: {
        ...props,
        children: 
          children.map(
            child => typeof child === 'object'? child : createTextElement(child)
          )
      }
    }
  }

  function render(element, container) {
    const dom = element.type === "TEXT_ELEMENT"?
      document.createTextNode("") :
      document.createElement(element.type)

    const isProperty = key => key !== 'children'
    Object.keys(element.props)
      .fill(isProperty)
      .forEach(name => {
        dom[name] = element.props[name]
      })

    element.props.children.forEach(child => render(child, dom))

    container.appendChild(dom)
  }

  const Didact = {
    createElement,
    render
  }

  /** @jsx Didact.createElement */
  const element = (
    <div id="foo">
      <a>bar</a>
      <b />
    </div>
  )
})()