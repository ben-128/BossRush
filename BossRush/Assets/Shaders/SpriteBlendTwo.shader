Shader "Sprites/BlendTwo"
{
    Properties
    {
        [PerRendererData] _MainTex ("Texture principale", 2D) = "white" {}
        _BlendTex ("Texture secondaire", 2D) = "white" {}
        _BlendAmount ("Fusion", Range(0,1)) = 0.15
        _Color ("Tint", Color) = (1,1,1,1)
        [HideInInspector] _RendererColor ("RendererColor", Color) = (1,1,1,1)
    }

    SubShader
    {
        Tags
        {
            "Queue"="Transparent"
            "IgnoreProjector"="True"
            "RenderType"="Transparent"
            "PreviewType"="Plane"
            "CanUseSpriteAtlas"="True"
        }

        Cull Off
        Lighting Off
        ZWrite Off
        ZTest Off
        Fog { Mode Off }
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex   : POSITION;
                float4 color    : COLOR;
                float2 uv       : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float4 vertex   : SV_POSITION;
                fixed4 color    : COLOR;
                float2 uv       : TEXCOORD0;
            };

            sampler2D _MainTex;
            sampler2D _BlendTex;
            half _BlendAmount;
            fixed4 _Color;

            v2f vert(appdata v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.color = v.color * _Color;
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                fixed4 main = tex2D(_MainTex, i.uv) * i.color;
                fixed4 blend = tex2D(_BlendTex, i.uv);

                main.rgb = lerp(main.rgb, blend.rgb, _BlendAmount * main.a);

                return main;
            }
            ENDCG
        }
    }
}
