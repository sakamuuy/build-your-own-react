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

  function createDom(fiber) {
    const dom = element.type === "TEXT_ELEMENT"?
      document.createTextNode("") :
      document.createElement(element.type)

    const isProperty = key => key !== 'children'
    Object.keys(element.props)
      .fill(isProperty)
      .forEach(name => {
        dom[name] = element.props[name]
      })

    return dom
  }

  const isEvent = key => key.startsWith("on")
  const isProperty = key => key !== "children" && !isEvent(key)
  const isNew = (prev, next) => key => prev[key] !== next[key]
  const isGone = (prev, next) => key => !(key in next)
  function updateDom(dom, prevProps, nextProps) {
    Object.keys(prevProps)
      .filter(isEvent)
      .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
      .forEach(name => {
        const eventType = name.toLowerCase().substring(2)
        dom.removeEventListener(
          eventType,
          prevProps[name]
        )
      })
    // 古いプロパティを削除
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(prevProps, nextProps))
      .forEach(name => {
        dom[name] = ""
      })

      // 追加/更新されたプロパティをset
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach(name => {
        com[name] = nextprops[name]
      })
  }

  function render(element, container) {
    wipRoot = {
      dom: container,
      props: {
        children: [element]
      },
      alternate: currentRoot
    }
    deletions = []
    nextUnitOfWork = wipRoot
  }

  function commitRoot() {
    commitWork(wipRoot.child)
    wipRoot = null
  }

  function commitWork(fiber) {
    if (!fiber) {
      return
    }
    const domParent = fiber.parent.dom
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    } else if (fiber.effectTag === "DELETION") {
      domParent.removeChild(fiber.dom)
    }
    
    commitWork(fiber.child)
    commitWork(fiber.sibling)
  }

  let currentRoot = null
  let wipRoot = null
  let nextUnitOfWork = null
  let deletions = null
  function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
      shouldYield = deadline.timeRemaining() < 1
    }

    if (!nextUnitOfWork && wipRoot) {
      commitRoot()
    }
    requestIdleCallback(workLoop)
  }

  requestIdleCallback(workLoop)

  function performUnitOfWork(fiber) {
    // Create element's DOM
    if (!fiber.dom) {
      fiber.dom = createDom(fiber)
    }

    // Remove because render real DOM at this point.
    // Appent DOM to parent
    // if (fiber.parent) {
    //   fiber.parent.dom.appendChild(fiber.dom)
    // }

    const elements = fiber.props.children
    // let index = 0
    // // Prev sibling is elements that is rendered by prev below loop.
    // let prevSibling = null

    // // Do for each children elements.
    while (index < elements.length) {
    //   const element = elements[index]
    //   // Create new fiber 
    //   // The reason is newFiber.dom is null that adove createDOM()
    //   const newFiber = {
    //     type: element.type,
    //     props: element.props,
    //     parent: fiber,
    //     dom: null
    //   }

    //   // 最初の子要素であればchild
    //   if (index === 0) {
    //     fiber.child = newFiber
    //   }
    //   // If index !== 0 , prevSibling is not null always.
    //   else {
    //     prevSibling.sibling = newFiber
    //   }

      // Prevsibling should be prev element
      // prevSibling = newFiber
      // index++

      // 子要素、兄弟、おじの順で処理
      if (fiber.child) {
        return fiber.child
      }
      let nextFiber = fiber
      while (nextFiber) {
        if (nextFiber.sibling) {
          return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
      }
    }
  }

  function reconcileChildren(wipFiber, elements) {
    let index = 0
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    // Prev sibling is elements that is rendered by prev below loop.
    let prevSibling = null

    // Do for each children elements.
    while (index < elements.length) {
      const element = elements[index]
      let newFiber = null
      // Create new fiber 
      // The reason is newFiber.dom is null that adove createDOM()
      // const newFiber = {
      //   type: element.type,
      //   props: element.props,
      //   parent: fiber,
      //   dom: null
      // }

      const sameType = oldFiber && element && element.type === oldFiber.type

      if (sameType) {
        // update node
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          parent: wipFiber,
          alternate: oldFiber,
          effectTag: "UPDATE"
        }
      }

      if (element && !sameType) {
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,
          parent: wipFiber,
          alternate: null,
          effectTag: "PLACEMENT",
        }
      }

      if (oldFiber && !sameType) {
        oldFiber.effectTag = "DELETION"
        deletions.push(oldFiber)
      }

      if (oldFiber) {
        oldFiber = oldFiber.sibling
      }

      // 最初の子要素であればchild
      if (index === 0) {
        fiber.child = newFiber
      }
      // If index !== 0 , prevSibling is not null always.
      else {
        prevSibling.sibling = newFiber
      }

      prevSibling = newFiber
      index++
    }
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
  const container = document.getElementById('root')
  Didact.render(element, container)
})()